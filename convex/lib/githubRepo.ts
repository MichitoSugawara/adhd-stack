import { asNumber, asRecord, asString, readJson } from "./httpJson";

export const ADHD_REPO_NAME = "adhd-app";

export interface GitHubRepo {
  fullName: string;
  htmlUrl: string;
  id: number;
  owner: string;
  repo: string;
}

const githubHeaders = (token: string): HeadersInit => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "User-Agent": "adhd-stack",
});

const repoFromPayload = (
  payload: Record<string, unknown>
): GitHubRepo | undefined => {
  const fullName = asString(payload.full_name);
  const htmlUrl = asString(payload.html_url);
  const owner = asString(asRecord(payload.owner).login);
  const repo = asString(payload.name);
  const id = asNumber(payload.id);
  if (!(fullName && htmlUrl && owner && repo && id !== undefined)) {
    return undefined;
  }
  return { fullName, htmlUrl, id, owner, repo };
};

export const fetchGitHubRepo = async (
  token: string,
  owner: string,
  repo: string
): Promise<GitHubRepo> => {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    { headers: githubHeaders(token) }
  );
  const payload = await readJson(response);
  const parsed = repoFromPayload(payload);
  if (!response.ok || !parsed) {
    throw new Error(
      asString(payload.message) ?? "GitHub リポジトリを取得できませんでした"
    );
  }
  return parsed;
};

export const ensureAdhdRepo = async (
  token: string,
  existingFullName?: string
): Promise<GitHubRepo> => {
  if (existingFullName) {
    const [owner, name] = existingFullName.split("/");
    if (owner && name) {
      return await fetchGitHubRepo(token, owner, name);
    }
  }
  const created = await fetch("https://api.github.com/user/repos", {
    body: JSON.stringify({
      auto_init: true,
      description: "ADHD Stack が用意したリポジトリ",
      name: ADHD_REPO_NAME,
      private: true,
    }),
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const payload = await readJson(created);
  if (created.ok) {
    const repo = repoFromPayload(payload);
    if (repo) {
      return repo;
    }
  }
  if (created.status === 422) {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: githubHeaders(token),
    });
    const user = await readJson(userResponse);
    const login = asString(user.login);
    if (login) {
      return await fetchGitHubRepo(token, login, ADHD_REPO_NAME);
    }
  }
  throw new Error(
    asString(payload.message) ?? "GitHub リポジトリを作成できませんでした"
  );
};
