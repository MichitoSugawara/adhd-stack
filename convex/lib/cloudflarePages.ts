import { asList, asRecord, asString, payloadText, readJson } from "./httpJson";
import { looksLikeCfAccountId } from "./jwt";
import { reconnectMessage } from "./tokenRefresh";

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

const isExpiredCloudflareToken = (
  status: number,
  payload: Record<string, unknown>
): boolean => {
  if (status !== 401 && status !== 403) {
    return false;
  }
  const text =
    `${payloadText(payload)} ${asString(payload.error) ?? ""}`.toLowerCase();
  return (
    text.includes("invalid_token") ||
    text.includes("token expired") ||
    text.includes("authentication error") ||
    text.includes("access token expired")
  );
};

const formatCloudflareError = (
  status: number,
  payload: Record<string, unknown>
): string => {
  if (isExpiredCloudflareToken(status, payload)) {
    return reconnectMessage("cloudflare");
  }
  const messages = asList(payload.errors)
    .map((item) => asString(asRecord(item).message))
    .filter((item): item is string => item !== undefined);
  const detail =
    messages.length > 0 ? messages.join("; ") : payloadText(payload);
  return `Cloudflare アカウントを取得できませんでした: HTTP ${status} ${detail}`;
};

const accountIdFromMemberships = (
  payload: Record<string, unknown>
): string | undefined => {
  for (const item of asList(payload.result)) {
    const row = asRecord(item);
    const accountId =
      asString(asRecord(row.account).id) ?? asString(row.account_id);
    if (looksLikeCfAccountId(accountId)) {
      return accountId;
    }
  }
  return undefined;
};

export const getCloudflareAccountId = async (
  token: string,
  hint?: string
): Promise<string> => {
  if (looksLikeCfAccountId(hint)) {
    return hint;
  }

  const memberships = await fetch(
    "https://api.cloudflare.com/client/v4/memberships",
    { headers: headersFor(token) }
  );
  const membershipPayload = await readJson(memberships);
  if (memberships.ok) {
    const fromMemberships = accountIdFromMemberships(membershipPayload);
    if (fromMemberships) {
      return fromMemberships;
    }
  } else {
    if (isExpiredCloudflareToken(memberships.status, membershipPayload)) {
      throw new Error(reconnectMessage("cloudflare"));
    }
    console.error("Cloudflare memberships failed", {
      body: payloadText(membershipPayload),
      status: memberships.status,
    });
  }

  const userinfo = await fetch("https://dash.cloudflare.com/oauth2/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const profile = await readJson(userinfo);
  if (userinfo.ok) {
    const fromProfile =
      asString(profile.account_id) ??
      asString(asRecord(asList(profile.accounts)[0]).id);
    if (looksLikeCfAccountId(fromProfile)) {
      return fromProfile;
    }
  } else {
    if (isExpiredCloudflareToken(userinfo.status, profile)) {
      throw new Error(reconnectMessage("cloudflare"));
    }
    console.error("Cloudflare userinfo failed", {
      body: payloadText(profile),
      status: userinfo.status,
    });
  }

  const accounts = await fetch(
    "https://api.cloudflare.com/client/v4/accounts?per_page=1",
    { headers: headersFor(token) }
  );
  const payload = await readJson(accounts);
  const first = asRecord(asList(payload.result)[0]);
  const accountId = asString(first.id);
  if (accounts.ok && looksLikeCfAccountId(accountId)) {
    return accountId;
  }
  console.error("Cloudflare accounts list failed", {
    body: payloadText(payload),
    status: accounts.status,
  });
  throw new Error(formatCloudflareError(accounts.status, payload));
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
  accountHint?: string
): Promise<CloudflarePagesProject> => {
  const accountId = await getCloudflareAccountId(token, accountHint);
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
