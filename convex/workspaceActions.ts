"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { loadFreshConnection } from "./lib/actionAuth";
import type { TemplateKind } from "./lib/appTemplate";
import { ensurePagesProject } from "./lib/cloudflarePages";
import { getCodingBackend } from "./lib/codingBackends";
import { convexProjectName, ensureConvexProject } from "./lib/convexProject";
import { provisionGithubViaOpenConnector } from "./lib/githubFromOpenConnector";
import { provisionGithubViaToken } from "./lib/githubProvision";
import { reconnectMessage } from "./lib/tokenRefresh";

const emptySteps = () => ({
  backend: "pending" as const,
  convex: "pending" as const,
  pages: "pending" as const,
  repo: "pending" as const,
  template: "pending" as const,
});

interface WorkspacePatch {
  cloudflareAccountId?: string;
  cloudflarePagesUrl?: string;
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
  githubRepoId?: number;
  githubRepoName?: string;
  githubRepoUrl?: string;
  provisionError?: string;
  provisionStatus?: "error" | "pending" | "provisioning" | "ready";
  provisionSteps?: {
    backend: "done" | "error" | "pending" | "running" | "skipped";
    convex: "done" | "error" | "pending" | "running" | "skipped";
    pages: "done" | "error" | "pending" | "running" | "skipped";
    repo: "done" | "error" | "pending" | "running" | "skipped";
    template: "done" | "error" | "pending" | "running" | "skipped";
  };
  templateKind?: TemplateKind;
}

const patch = async (
  ctx: ActionCtx,
  workspaceId: Id<"workspaces">,
  updates: WorkspacePatch
) => {
  await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
    ...updates,
    provisionStatus: updates.provisionStatus ?? "provisioning",
    workspaceId,
  });
};

const note = async (
  ctx: ActionCtx,
  workspaceId: Id<"workspaces">,
  body: string
) => {
  await ctx.runMutation(internal.workspaceInternal.insertSystemMessage, {
    body,
    workspaceId,
  });
};

const githubHandle = async (
  ctx: ActionCtx,
  userId: Id<"users">
): Promise<
  | { connectionName: string; mode: "connector" }
  | { mode: "token"; token: string }
  | null
> => {
  const token = await loadFreshConnection(ctx, userId, "github");
  if (token) {
    return { mode: "token", token: token.accessToken };
  }
  const connector = await ctx.runQuery(
    internal.oauthStore.getConnectorConnection,
    { provider: "github", userId }
  );
  if (connector?.status === "connected" && connector.connectionName) {
    return { connectionName: connector.connectionName, mode: "connector" };
  }
  return null;
};

export const provisionWorkspace = internalAction({
  args: {
    force: v.optional(v.boolean()),
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(
      internal.workspaceInternal.getWorkspace,
      { workspaceId: args.workspaceId }
    );
    const environmentId =
      existing?.codingEnvironmentId ?? existing?.codexEnvironmentId;
    if (
      existing?.provisionStatus === "ready" &&
      existing.githubRepoUrl &&
      environmentId &&
      !args.force
    ) {
      return null;
    }
    if (existing?.provisionStatus === "provisioning" && !args.force) {
      return null;
    }

    const steps = existing?.provisionSteps ?? emptySteps();
    await patch(ctx, args.workspaceId, { provisionSteps: steps });

    try {
      const blockers: string[] = [];
      const warnings: string[] = [];
      let githubOwner = existing?.githubOwner;
      let githubRepoFullName = existing?.githubRepoFullName;
      let githubRepoId = existing?.githubRepoId;
      let githubRepoName = existing?.githubRepoName;
      let githubRepoUrl = existing?.githubRepoUrl;
      let codingEnvironmentId = environmentId;
      let cloudflareAccountId = existing?.cloudflareAccountId;
      let cloudflarePagesUrl = existing?.cloudflarePagesUrl;
      let cloudflareProjectName = existing?.cloudflareProjectName;
      let convexDeploymentName = existing?.convexDeploymentName;
      let convexProjectSlug = existing?.convexProjectSlug;
      let convexTeamSlug = existing?.convexTeamSlug;
      let convexUrl = existing?.convexUrl;
      let templateKind: TemplateKind | undefined = existing?.templateKind;
      const slug = existing?.slug ?? "workspace";
      const appName = existing?.name ?? slug;

      steps.repo = "running";
      await patch(ctx, args.workspaceId, { provisionSteps: { ...steps } });

      const github = await githubHandle(ctx, args.userId);
      if (github) {
        try {
          const result =
            github.mode === "token"
              ? await provisionGithubViaToken({
                  existingFullName: githubRepoFullName,
                  name: appName,
                  slug,
                  token: github.token,
                })
              : await provisionGithubViaOpenConnector({
                  connectionName: github.connectionName,
                  existingFullName: githubRepoFullName,
                  name: appName,
                  slug,
                });
          const { repo, templateKind: seededKind } = result;
          const { fullName, htmlUrl, id, owner, repo: repoName } = repo;
          templateKind = seededKind;
          githubOwner = owner;
          githubRepoFullName = fullName;
          githubRepoId = id;
          githubRepoName = repoName;
          githubRepoUrl = htmlUrl;
          steps.repo = "done";
          steps.template = "done";
          await patch(ctx, args.workspaceId, {
            githubOwner,
            githubRepoFullName,
            githubRepoId,
            githubRepoName,
            githubRepoUrl,
            provisionSteps: { ...steps },
            templateKind,
          });
          await note(ctx, args.workspaceId, `GitHub: ${repo.htmlUrl}`);
        } catch (error) {
          steps.repo = "error";
          steps.template = "error";
          blockers.push(
            error instanceof Error
              ? error.message
              : "GitHub のプロビジョニングに失敗しました"
          );
        }
      } else {
        steps.repo = "error";
        blockers.push(reconnectMessage("github"));
      }

      const chatgpt = await loadFreshConnection(ctx, args.userId, "chatgpt");
      if (githubOwner && githubRepoName && chatgpt) {
        steps.backend = "running";
        await patch(ctx, args.workspaceId, { provisionSteps: { ...steps } });
        try {
          const backend = getCodingBackend(
            existing?.codingBackend ?? "codex_cloud"
          );
          const environment = await backend.provisionEnvironment({
            chatgptAccessToken: chatgpt.accessToken,
            chatgptAccountId: chatgpt.accountId,
            githubOwner,
            githubRepoName,
            label: slug,
          });
          codingEnvironmentId = environment.environmentId;
          steps.backend = "done";
          await patch(ctx, args.workspaceId, {
            codexEnvironmentId: environment.environmentId,
            codingBackend: backend.kind,
            codingEnvironmentId,
            provisionSteps: { ...steps },
          });
          await note(
            ctx,
            args.workspaceId,
            `実行環境を用意しました: ${environment.environmentId}`
          );
        } catch (error) {
          steps.backend = "error";
          blockers.push(
            error instanceof Error
              ? error.message
              : "実行環境を作成できませんでした"
          );
        }
      } else if (!chatgpt) {
        steps.backend = "error";
        blockers.push(reconnectMessage("chatgpt"));
      }

      const cloudflare = await loadFreshConnection(
        ctx,
        args.userId,
        "cloudflare"
      );
      if (cloudflare && githubOwner && githubRepoName) {
        steps.pages = "running";
        await patch(ctx, args.workspaceId, { provisionSteps: { ...steps } });
        try {
          const project = await ensurePagesProject(
            cloudflare.accessToken,
            githubOwner,
            githubRepoName,
            githubRepoId,
            cloudflare.accountId,
            slug
          );
          cloudflareAccountId = project.accountId;
          cloudflarePagesUrl = project.url;
          cloudflareProjectName = project.name;
          steps.pages = "done";
        } catch (error) {
          steps.pages = "error";
          warnings.push(
            error instanceof Error
              ? error.message
              : "Cloudflare Pages のプロビジョニングに失敗しました"
          );
        }
      } else if (!cloudflare) {
        steps.pages = "skipped";
        warnings.push(reconnectMessage("cloudflare"));
      }

      const convex = await loadFreshConnection(ctx, args.userId, "convex");
      if (convex) {
        steps.convex = "running";
        await patch(ctx, args.workspaceId, { provisionSteps: { ...steps } });
        try {
          const project = await ensureConvexProject(
            convex.accessToken,
            convexProjectName(slug)
          );
          convexDeploymentName = project.deploymentName;
          convexProjectSlug = project.projectSlug;
          convexTeamSlug = project.teamSlug;
          convexUrl = project.url;
          steps.convex = "done";
        } catch (error) {
          steps.convex = "error";
          warnings.push(
            error instanceof Error
              ? error.message
              : "Convex プロジェクトのプロビジョニングに失敗しました"
          );
        }
      } else {
        steps.convex = "skipped";
        warnings.push("Convex は接続カタログ経由です。公開は次の段階です");
      }

      const ready = Boolean(githubRepoUrl && codingEnvironmentId);
      const notes = ready ? warnings : [...blockers, ...warnings];
      await patch(ctx, args.workspaceId, {
        cloudflareAccountId,
        cloudflarePagesUrl,
        cloudflareProjectName,
        codexEnvironmentId: codingEnvironmentId,
        codingBackend: existing?.codingBackend ?? "codex_cloud",
        codingEnvironmentId,
        convexDeploymentName,
        convexProjectSlug,
        convexTeamSlug,
        convexUrl,
        githubOwner,
        githubRepoFullName,
        githubRepoId,
        githubRepoName,
        githubRepoUrl,
        provisionError: notes.length > 0 ? notes.join(" / ") : "",
        provisionStatus: ready ? "ready" : "error",
        provisionSteps: { ...steps },
        templateKind,
      });
      await note(
        ctx,
        args.workspaceId,
        ready
          ? "準備できました。チャットで指示してください。"
          : notes.join(" / ") || "準備に失敗しました"
      );
      return null;
    } catch (error) {
      await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
        provisionError:
          error instanceof Error ? error.message : "準備に失敗しました",
        provisionStatus: "error",
        workspaceId: args.workspaceId,
      });
      throw error;
    }
  },
  returns: v.null(),
});
