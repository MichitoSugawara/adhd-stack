import { asList, asRecord, asString, readJson } from "./httpJson";

export const ADHD_PAGES_PROJECT = "adhd-app";

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
  token: string
): Promise<string> => {
  const response = await fetch(
    "https://api.cloudflare.com/client/v4/accounts?per_page=1",
    { headers: headersFor(token) }
  );
  const payload = await readJson(response);
  const first = asRecord(asList(payload.result)[0]);
  const accountId = asString(first.id);
  if (!(response.ok && accountId)) {
    throw new Error("Cloudflare アカウントを取得できませんでした");
  }
  return accountId;
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
  repoId?: number
): Promise<CloudflarePagesProject> => {
  const accountId = await getCloudflareAccountId(token);
  const existing = await getPagesProject(token, accountId, ADHD_PAGES_PROJECT);
  if (existing) {
    return existing;
  }
  const withSource = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
    {
      body: JSON.stringify({
        name: ADHD_PAGES_PROJECT,
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
        name: ADHD_PAGES_PROJECT,
        production_branch: "main",
      }),
      headers: headersFor(token),
      method: "POST",
    }
  );
  const payload = await readJson(bare);
  if (bare.status === 409) {
    const reused = await getPagesProject(token, accountId, ADHD_PAGES_PROJECT);
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

export const triggerPagesDeployment = async (
  token: string,
  accountId: string,
  projectName: string
): Promise<{ status?: string; url?: string }> => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      headers: headersFor(token),
      method: "POST",
    }
  );
  const payload = await readJson(response);
  const result = asRecord(payload.result);
  if (!response.ok) {
    throw new Error(
      asString(asRecord(asList(payload.errors)[0]).message) ??
        `Pages のデプロイを開始できませんでした: HTTP ${response.status}`
    );
  }
  return {
    status: asString(asRecord(result.latest_stage).status),
    url: asString(result.url),
  };
};
