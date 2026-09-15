import { asNumber, asRecord, asString, readJson } from "./httpJson";

export interface GitHubRepo {
  fullName: string;
  htmlUrl: string;
  id: number;
  owner: string;
  repo: string;
}

export interface EnsureNamedRepoResult {
  created: boolean;
  repo: GitHubRepo;
}

const githubHeaders = (token: string): HeadersInit => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "User-Agent": "adhd-stack",
});

export const repoFromPayload = (
  payload: Record<string, unknown>
): GitHubRepo | undefined => {
  const nested = asRecord(payload.repository);
  const source = Object.keys(nested).length > 0 ? nested : payload;
  const fullName = asString(source.full_name) ?? asString(source.fullName);
  const htmlUrl = asString(source.html_url) ?? asString(source.htmlUrl);
  const owner =
    asString(asRecord(source.owner).login) ?? asString(source.owner);
  const repo = asString(source.name) ?? asString(source.repo);
  const id = asNumber(source.id);
  if (!(fullName && htmlUrl && owner && repo && id !== undefined)) {
    return undefined;
  }
  return { fullName, htmlUrl, id, owner, repo };
};

export const fetchGitHubUserLogin = async (token: string): Promise<string> => {
  const response = await fetch("https://api.github.com/user", {
    headers: githubHeaders(token),
  });
  const payload = await readJson(response);
  const login = asString(payload.login);
  if (!response.ok || !login) {
    throw new Error(
      asString(payload.message) ?? "GitHub ユーザーを取得できませんでした"
    );
  }
  return login;
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

export const utf8ToBase64 = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
};

export const putGitHubFile = async (args: {
  content: string;
  message: string;
  owner: string;
  path: string;
  repo: string;
  token: string;
}): Promise<void> => {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(args.owner)}/${encodeURIComponent(args.repo)}/contents/${args.path}`,
    {
      body: JSON.stringify({
        content: utf8ToBase64(args.content),
        message: args.message,
      }),
      headers: {
        ...githubHeaders(args.token),
        "Content-Type": "application/json",
      },
      method: "PUT",
    }
  );
  if (!response.ok && response.status !== 422) {
    const payload = await readJson(response);
    throw new Error(
      asString(payload.message) ?? `${args.path} を書けませんでした`
    );
  }
};

export const createGitHubRepo = async (args: {
  description: string;
  name: string;
  token: string;
}): Promise<GitHubRepo> => {
  const created = await fetch("https://api.github.com/user/repos", {
    body: JSON.stringify({
      auto_init: false,
      description: args.description,
      name: args.name,
      private: true,
    }),
    headers: {
      ...githubHeaders(args.token),
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
    const login = await fetchGitHubUserLogin(args.token);
    return await fetchGitHubRepo(args.token, login, args.name);
  }
  throw new Error(
    asString(payload.message) ?? "GitHub リポジトリを作成できませんでした"
  );
};

export const createGitHubRepoFromTemplate = async (args: {
  description: string;
  name: string;
  templateOwner: string;
  templateRepo: string;
  token: string;
}): Promise<GitHubRepo> => {
  const login = await fetchGitHubUserLogin(args.token);
  const created = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(args.templateOwner)}/${encodeURIComponent(args.templateRepo)}/generate`,
    {
      body: JSON.stringify({
        description: args.description,
        include_all_branches: false,
        name: args.name,
        owner: login,
        private: true,
      }),
      headers: {
        ...githubHeaders(args.token),
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );
  const payload = await readJson(created);
  if (created.ok) {
    const repo = repoFromPayload(payload);
    if (repo) {
      return repo;
    }
  }
  if (created.status === 422) {
    return await fetchGitHubRepo(args.token, login, args.name);
  }
  throw new Error(
    asString(payload.message) ?? "テンプレートからリポジトリを作れませんでした"
  );
};

export const ensureNamedRepo = async (args: {
  existingFullName?: string;
  name: string;
  token: string;
}): Promise<EnsureNamedRepoResult> => {
  if (args.existingFullName) {
    const [owner, name] = args.existingFullName.split("/");
    if (owner && name) {
      return {
        created: false,
        repo: await fetchGitHubRepo(args.token, owner, name),
      };
    }
  }
  const repo = await createGitHubRepo({
    description: "ADHD Stack が tahcode 由来で用意したリポジトリ",
    name: args.name,
    token: args.token,
  });
  return { created: true, repo };
};
