import {
  HOST_CONVEX_DEPLOYMENT,
  HOST_WORKER_NAME,
  isHostConvexResource,
  isHostGitHubRepo,
  isHostPagesProject,
} from "./hostSafety";

export type CascadeRemoteKind =
  | "cloudflare_pages"
  | "codex_environment"
  | "convex_project"
  | "github_repo";

export type CascadeKind = CascadeRemoteKind | "local_records";

export type CascadePlanDecision = "block" | "delete" | "skip";

export interface CascadeWorkspaceSnapshot {
  cloudflareAccountId?: string;
  cloudflareProjectName?: string;
  codingBackend?: "codex_cloud" | "cursor_cloud";
  codingEnvironmentId?: string;
  codexEnvironmentId?: string;
  convexDeploymentName?: string;
  convexProjectSlug?: string;
  convexTeamSlug?: string;
  convexUrl?: string;
  githubOwner?: string;
  githubRepoFullName?: string;
  githubRepoName?: string;
  githubRepoUrl?: string;
}

export interface GitHubRepoTarget {
  owner: string;
  repo: string;
}

export interface PagesProjectTarget {
  accountId?: string;
  projectName: string;
}

export interface ConvexProjectDeleteTarget {
  deploymentName?: string;
  projectSlug: string;
  teamSlug?: string;
}

export interface CascadePlanItem {
  convex?: ConvexProjectDeleteTarget;
  decision: CascadePlanDecision;
  github?: GitHubRepoTarget;
  kind: CascadeRemoteKind;
  message: string;
  pages?: PagesProjectTarget;
  environmentId?: string;
}

const present = (value?: string): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

export const githubRepoFromUrl = (
  value: string
): GitHubRepoTarget | undefined => {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    if (host !== "github.com" && host !== "www.github.com") {
      return undefined;
    }
    const [owner, repo] = parsed.pathname
      .replace(/\.git$/u, "")
      .split("/")
      .filter((part) => part.length > 0);
    if (owner && repo) {
      return { owner, repo };
    }
  } catch {
    return undefined;
  }
  return undefined;
};

export const githubRepoFromWorkspace = (
  workspace: CascadeWorkspaceSnapshot
): GitHubRepoTarget | undefined => {
  const owner = present(workspace.githubOwner);
  const repo = present(workspace.githubRepoName);
  if (owner && repo) {
    return { owner, repo };
  }
  const fullName = present(workspace.githubRepoFullName);
  if (fullName) {
    const [fullOwner, fullRepo] = fullName.split("/");
    if (fullOwner && fullRepo) {
      return { owner: fullOwner, repo: fullRepo };
    }
  }
  const url = present(workspace.githubRepoUrl);
  return url ? githubRepoFromUrl(url) : undefined;
};

export const codingEnvironmentIdFromWorkspace = (
  workspace: CascadeWorkspaceSnapshot
): string | undefined =>
  present(workspace.codingEnvironmentId) ??
  present(workspace.codexEnvironmentId);

const githubItem = (workspace: CascadeWorkspaceSnapshot): CascadePlanItem => {
  const target = githubRepoFromWorkspace(workspace);
  if (!target) {
    return {
      decision: "skip",
      kind: "github_repo",
      message: "保存先はまだつながっていません",
    };
  }
  if (isHostGitHubRepo(target.repo)) {
    return {
      decision: "block",
      github: target,
      kind: "github_repo",
      message: `ホスト本体（${HOST_WORKER_NAME}）の保存先は消しません`,
    };
  }
  return {
    decision: "delete",
    github: target,
    kind: "github_repo",
    message: "保存先を消します",
  };
};

const pagesItem = (workspace: CascadeWorkspaceSnapshot): CascadePlanItem => {
  const projectName = present(workspace.cloudflareProjectName);
  if (!projectName) {
    return {
      decision: "skip",
      kind: "cloudflare_pages",
      message: "公開ページはまだありません",
    };
  }
  if (isHostPagesProject(projectName)) {
    return {
      decision: "block",
      kind: "cloudflare_pages",
      message: `ホスト本体（${HOST_WORKER_NAME}）の公開ページは消しません`,
      pages: {
        accountId: present(workspace.cloudflareAccountId),
        projectName,
      },
    };
  }
  return {
    decision: "delete",
    kind: "cloudflare_pages",
    message: "公開ページを消します",
    pages: {
      accountId: present(workspace.cloudflareAccountId),
      projectName,
    },
  };
};

const convexItem = (workspace: CascadeWorkspaceSnapshot): CascadePlanItem => {
  const projectSlug = present(workspace.convexProjectSlug);
  const deploymentName = present(workspace.convexDeploymentName);
  const url = present(workspace.convexUrl);
  if (!(projectSlug || deploymentName || url)) {
    return {
      decision: "skip",
      kind: "convex_project",
      message: "アプリのデータはまだありません",
    };
  }
  if (
    isHostConvexResource({
      deploymentName,
      projectSlug,
      url,
    })
  ) {
    return {
      convex: projectSlug
        ? {
            deploymentName,
            projectSlug,
            teamSlug: present(workspace.convexTeamSlug),
          }
        : undefined,
      decision: "block",
      kind: "convex_project",
      message: `ホスト本体（${HOST_CONVEX_DEPLOYMENT}）のデータは消しません`,
    };
  }
  if (!projectSlug) {
    return {
      decision: "skip",
      kind: "convex_project",
      message: "アプリのデータの場所が記録されていないので、消しません",
    };
  }
  return {
    convex: {
      deploymentName,
      projectSlug,
      teamSlug: present(workspace.convexTeamSlug),
    },
    decision: "delete",
    kind: "convex_project",
    message: "アプリのデータを消します",
  };
};

const codexItem = (workspace: CascadeWorkspaceSnapshot): CascadePlanItem => {
  const environmentId = codingEnvironmentIdFromWorkspace(workspace);
  if (!environmentId) {
    return {
      decision: "skip",
      kind: "codex_environment",
      message: "実行環境はまだありません",
    };
  }
  if (
    workspace.codingBackend === "cursor_cloud" ||
    environmentId.startsWith("cursor-repo:")
  ) {
    return {
      decision: "skip",
      environmentId,
      kind: "codex_environment",
      message: "この実行環境は Codex Cloud ではないため、削除対象にしません",
    };
  }
  return {
    decision: "delete",
    environmentId,
    kind: "codex_environment",
    message: "実行環境を消します",
  };
};

export const planCascadeDelete = (
  workspace: CascadeWorkspaceSnapshot
): CascadePlanItem[] => [
  codexItem(workspace),
  pagesItem(workspace),
  githubItem(workspace),
  convexItem(workspace),
];
