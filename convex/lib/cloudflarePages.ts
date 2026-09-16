import { resolveCloudflareAccountId } from "./cloudflareAccount";
import { asList, asRecord, asString, readJson } from "./httpJson";
import {
  CONVEX_PAGES_BUILD_COMMAND,
  mergePagesBuildConfig,
  mergePagesProductionEnvVars,
  pagesConvexEnvUpdates,
} from "./pagesEnv";
import { pagesEnvironmentsFrom } from "./pagesEnvironments";
import type { PagesDeployment, PagesEnvironments } from "./pagesEnvironments";
import { reconnectMessage } from "./tokenRefresh";

export type { PagesDeployment, PagesEnvironments } from "./pagesEnvironments";
export { pagesEnvironmentsFrom } from "./pagesEnvironments";

export const pagesProjectName = (slug: string): string => slug.slice(0, 58);

export interface CloudflarePagesProject {
  accountId: string;
  name: string;
  url?: string;
}

const headersFor = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const projectUrl = (project: Record<string, unknown>): string | undefined => {
  const subdomain = asString(project.subdomain);
  if (subdomain) {
    return `https://${subdomain}`;
  }
  const canonical = asRecord(project.canonical_deployment);
  return asString(canonical.url) ?? asString(project.domains);
};

const parseProject = (
  accountId: string,
  payload: Record<string, unknown>
): CloudflarePagesProject | undefined => {
  const project = asRecord(payload.result);
  const name = asString(project.name);
  if (!name) {
    return undefined;
  }
  return { accountId, name, url: projectUrl(project) };
};

export const getCloudflareAccountId = async (
  token: string,
  hint?: string,
  fetcher: typeof fetch = fetch
): Promise<string> => {
  const resolved = await resolveCloudflareAccountId(token, hint, fetcher);
  if (resolved.ok) {
    return resolved.accountId;
  }
  if (resolved.expired) {
    throw new Error(reconnectMessage("cloudflare"));
  }
  const messages = asList(resolved.payload.errors)
    .map((item) => asString(asRecord(item).message))
    .filter((item): item is string => item !== undefined);
  const detail = messages.length > 0 ? messages.join("; ") : "no account id";
  throw new Error(
    `Cloudflare アカウントを取得できませんでした: HTTP ${String(resolved.status)} ${detail}`
  );
};

export const getPagesProject = async (
  token: string,
  accountId: string,
  name: string
): Promise<CloudflarePagesProject | undefined> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${name}`,
    { headers: headersFor(token) }
  );
  if (!response.ok) {
    return undefined;
  }
  return parseProject(accountId, await readJson(response));
};

const sourceConfig = (owner: string, repo: string, repoId?: number) => ({
  config: {
    deployments_enabled: true,
    owner,
    pr_comments_enabled: false,
    preview_deployment_setting: "none",
    production_branch: "main",
    production_deployments_enabled: true,
    repo_name: repo,
    ...(repoId === undefined ? {} : { repo_id: String(repoId) }),
  },
  type: "github",
});

export const ensurePagesProject = async (
  token: string,
  owner: string,
  repo: string,
  repoId?: number,
  accountHint?: string,
  projectName = pagesProjectName(repo)
): Promise<CloudflarePagesProject> => {
  const accountId = await getCloudflareAccountId(token, accountHint);
  const existing = await getPagesProject(token, accountId, projectName);
  if (existing) {
    return existing;
  }
  const withSource = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
    {
      body: JSON.stringify({
        name: projectName,
        production_branch: "main",
        source: sourceConfig(owner, repo, repoId),
      }),
      headers: headersFor(token),
      method: "POST",
    }
  );
  if (withSource.ok) {
    const created = parseProject(accountId, await readJson(withSource));
    if (created) {
      return created;
    }
  }
  const bare = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
    {
      body: JSON.stringify({
        name: projectName,
        production_branch: "main",
      }),
      headers: headersFor(token),
      method: "POST",
    }
  );
  const payload = await readJson(bare);
  if (bare.status === 409) {
    const reused = await getPagesProject(token, accountId, projectName);
    if (reused) {
      return reused;
    }
  }
  const created = parseProject(accountId, payload);
  if (bare.ok && created) {
    return created;
  }
  throw new Error(
    asString(asRecord(asList(payload.errors)[0]).message) ??
      "Cloudflare Pages プロジェクトを作成できませんでした"
  );
};

export const attachPagesGitHubSource = async (
  token: string,
  accountId: string,
  projectName: string,
  owner: string,
  repo: string,
  repoId?: number
): Promise<void> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}`,
    {
      body: JSON.stringify({
        production_branch: "main",
        source: sourceConfig(owner, repo, repoId),
      }),
      headers: headersFor(token),
      method: "PATCH",
    }
  );
  if (!response.ok) {
    const payload = await readJson(response);
    throw new Error(
      asString(asRecord(asList(payload.errors)[0]).message) ??
        `Cloudflare に GitHub を接続できませんでした: HTTP ${response.status}`
    );
  }
};

export const configurePagesForConvexDeploy = async (args: {
  accountId: string;
  convexUrl?: string;
  deployKey: string;
  deploymentName?: string;
  projectName: string;
  token: string;
}): Promise<void> => {
  const endpoint = `https://api.cloudflare.com/client/v4/accounts/${args.accountId}/pages/projects/${args.projectName}`;
  const current = await fetch(endpoint, { headers: headersFor(args.token) });
  const currentPayload = await readJson(current);
  if (!current.ok) {
    throw new Error(
      asString(asRecord(asList(currentPayload.errors)[0]).message) ??
        "Cloudflare Pages プロジェクトを読めませんでした"
    );
  }
  const result = asRecord(currentPayload.result);
  const buildConfig = asRecord(result.build_config);
  const deploymentConfigs = asRecord(result.deployment_configs);
  const production = asRecord(deploymentConfigs.production);
  const existingEnv = asRecord(production.env_vars);
  const updates = pagesConvexEnvUpdates({
    convexUrl: args.convexUrl,
    deployKey: args.deployKey,
    deploymentName: args.deploymentName,
  });
  const bodies = [
    {
      build_config: mergePagesBuildConfig(
        buildConfig,
        CONVEX_PAGES_BUILD_COMMAND
      ),
      deployment_configs: {
        ...deploymentConfigs,
        production: {
          ...production,
          env_vars: mergePagesProductionEnvVars(existingEnv, updates),
        },
      },
    },
    {
      build_config: mergePagesBuildConfig(
        buildConfig,
        CONVEX_PAGES_BUILD_COMMAND
      ),
      deployment_configs: {
        production: {
          env_vars: updates,
        },
      },
    },
  ];
  let lastMessage = "Cloudflare Pages にデプロイキーを載せられませんでした";
  for (const body of bodies) {
    const response = await fetch(endpoint, {
      body: JSON.stringify(body),
      headers: headersFor(args.token),
      method: "PATCH",
    });
    const payload = await readJson(response);
    if (response.ok) {
      return;
    }
    lastMessage =
      asString(asRecord(asList(payload.errors)[0]).message) ?? lastMessage;
  }
  throw new Error(lastMessage);
};

const pagesDeploymentFrom = (
  payload: Record<string, unknown>
): PagesDeployment => {
  const listed = asList(payload.result);
  const row =
    listed.length > 0 ? asRecord(listed[0]) : asRecord(payload.result);
  return {
    environment: asString(row.environment),
    id: asString(row.id),
    status: asString(asRecord(row.latest_stage).status),
    url: asString(row.url),
  };
};

export const listPagesEnvironments = async (
  token: string,
  accountId: string,
  projectName: string
): Promise<PagesEnvironments | undefined> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments?per_page=25`,
    { headers: headersFor(token) }
  );
  if (!response.ok) {
    return undefined;
  }
  const payload = await readJson(response);
  const rows = asList(payload.result).map((item) => {
    const row = asRecord(item);
    return {
      environment: asString(row.environment),
      id: asString(row.id),
      status: asString(asRecord(row.latest_stage).status),
      url: asString(row.url),
    } satisfies PagesDeployment;
  });
  return pagesEnvironmentsFrom(rows);
};

export const triggerPagesDeployment = async (
  token: string,
  accountId: string,
  projectName: string
): Promise<PagesDeployment> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      headers: headersFor(token),
      method: "POST",
    }
  );
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(
      asString(asRecord(asList(payload.errors)[0]).message) ??
        `Pages のデプロイを開始できませんでした: HTTP ${response.status}`
    );
  }
  return pagesDeploymentFrom(payload);
};

export const getPagesDeployment = async (
  token: string,
  accountId: string,
  projectName: string,
  deploymentId?: string
): Promise<PagesDeployment | undefined> => {
  const suffix = deploymentId
    ? `/deployments/${deploymentId}`
    : "/deployments?per_page=1";
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}${suffix}`,
    { headers: headersFor(token) }
  );
  if (!response.ok) {
    return undefined;
  }
  const parsed = pagesDeploymentFrom(await readJson(response));
  if (!(parsed.id || parsed.status || parsed.url)) {
    return undefined;
  }
  return parsed;
};
