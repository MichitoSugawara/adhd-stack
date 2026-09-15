import { tahcodeSeedFiles, templateRepoFromEnv } from "./appTemplate";
import type { TemplateKind } from "./appTemplate";
import { repoFromPayload, utf8ToBase64 } from "./githubRepo";
import type { GitHubRepo } from "./githubRepo";
import {
  invokeOpenConnectorAction,
  invokeOpenConnectorActionIds,
  proxyOpenConnector,
} from "./openConnectorActions";
import { asRecord, asString } from "./httpJson";

const envAction = (key: string, fallback: string): string =>
  process.env[key]?.trim() || fallback;

const userFromPayload = (payload: Record<string, unknown>): string => {
  const login =
    asString(payload.login) ??
    asString(asRecord(payload.user).login) ??
    asString(asRecord(payload.data).login);
  if (!login) {
    throw new Error("GitHub ユーザーを取得できませんでした");
  }
  return login;
};

const requireRepo = (payload: Record<string, unknown>): GitHubRepo => {
  const repo = repoFromPayload(payload) ?? repoFromPayload(asRecord(payload.data));
  if (!repo) {
    throw new Error("GitHub リポジトリの応答を読めませんでした");
  }
  return repo;
};

const getUserLogin = async (connectionName: string): Promise<string> => {
  try {
    const payload = await invokeOpenConnectorAction({
      actionId: envAction(
        "OPENCONNECTOR_GITHUB_GET_USER_ACTION",
        "github.get_current_user"
      ),
      connectionName,
      input: {},
    });
    return userFromPayload(payload);
  } catch {
    const proxied = await proxyOpenConnector({
      connectionName,
      endpoint: "/user",
      method: "GET",
      service: "github",
    });
    return userFromPayload(proxied.data);
  }
};

const getRepo = async (
  connectionName: string,
  owner: string,
  repo: string
): Promise<GitHubRepo> => {
  try {
    const payload = await invokeOpenConnectorActionIds({
      actionIds: [
        envAction("OPENCONNECTOR_GITHUB_GET_REPO_ACTION", ""),
        "github.get_a_repository",
        "github.repos_get",
      ],
      connectionName,
      input: { owner, repo },
    });
    return requireRepo(payload);
  } catch {
    const proxied = await proxyOpenConnector({
      connectionName,
      endpoint: `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
      method: "GET",
      service: "github",
    });
    return requireRepo(proxied.data);
  }
};

const createRepo = async (
  connectionName: string,
  name: string,
  description: string
): Promise<GitHubRepo> => {
  try {
    const payload = await invokeOpenConnectorActionIds({
      actionIds: [
        envAction("OPENCONNECTOR_GITHUB_CREATE_REPO_ACTION", ""),
        "github.create_a_repository_for_the_authenticated_user",
        "github.repos_create_for_authenticated_user",
        "github.create_repository",
      ],
      connectionName,
      input: {
        auto_init: false,
        description,
        name,
        private: true,
      },
    });
    return requireRepo(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("unknown_action:")) {
      const login = await getUserLogin(connectionName);
      try {
        return await getRepo(connectionName, login, name);
      } catch {
        throw error;
      }
    }
  }
  const proxied = await proxyOpenConnector({
    body: {
      auto_init: false,
      description,
      name,
      private: true,
    },
    connectionName,
    endpoint: "/user/repos",
    method: "POST",
    service: "github",
  });
  if (proxied.status === 422) {
    const login = await getUserLogin(connectionName);
    return await getRepo(connectionName, login, name);
  }
  if (proxied.status >= 400) {
    throw new Error("GitHub リポジトリを作成できませんでした");
  }
  return requireRepo(proxied.data);
};

const createFromTemplate = async (args: {
  connectionName: string;
  description: string;
  name: string;
  templateOwner: string;
  templateRepo: string;
}): Promise<GitHubRepo> => {
  const login = await getUserLogin(args.connectionName);
  try {
    const payload = await invokeOpenConnectorActionIds({
      actionIds: [
        envAction("OPENCONNECTOR_GITHUB_CREATE_FROM_TEMPLATE_ACTION", ""),
        "github.create_a_repository_using_a_template",
        "github.repos_create_using_a_template",
      ],
      connectionName: args.connectionName,
      input: {
        name: args.name,
        owner: login,
        private: true,
        template_owner: args.templateOwner,
        template_repo: args.templateRepo,
      },
    });
    return requireRepo(payload);
  } catch {
    const proxied = await proxyOpenConnector({
      body: {
        description: args.description,
        include_all_branches: false,
        name: args.name,
        owner: login,
        private: true,
      },
      connectionName: args.connectionName,
      endpoint: `/repos/${encodeURIComponent(args.templateOwner)}/${encodeURIComponent(args.templateRepo)}/generate`,
      method: "POST",
      service: "github",
    });
    if (proxied.status === 422) {
      return await getRepo(args.connectionName, login, args.name);
    }
    if (proxied.status >= 400) {
      throw new Error("テンプレートからリポジトリを作れませんでした");
    }
    return requireRepo(proxied.data);
  }
};

const putFile = async (args: {
  connectionName: string;
  content: string;
  message: string;
  owner: string;
  path: string;
  repo: string;
}): Promise<void> => {
  const body = {
    content: utf8ToBase64(args.content),
    message: args.message,
  };
  try {
    await invokeOpenConnectorActionIds({
      actionIds: [
        envAction("OPENCONNECTOR_GITHUB_PUT_FILE_ACTION", ""),
        "github.create_or_update_file_contents",
        "github.repos_create_or_update_file_contents",
        "github.create_or_update_file",
      ],
      connectionName: args.connectionName,
      input: {
        ...body,
        owner: args.owner,
        path: args.path,
        repo: args.repo,
      },
    });
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("unknown_action:")) {
      throw error;
    }
  }
  const proxied = await proxyOpenConnector({
    body,
    connectionName: args.connectionName,
    endpoint: `/repos/${encodeURIComponent(args.owner)}/${encodeURIComponent(args.repo)}/contents/${args.path}`,
    method: "PUT",
    service: "github",
  });
  if (proxied.status >= 400 && proxied.status !== 422) {
    throw new Error(`${args.path} を書けませんでした`);
  }
};

export const seedRepoViaOpenConnector = async (args: {
  connectionName: string;
  name: string;
  owner: string;
  repo: string;
}): Promise<void> => {
  const files = tahcodeSeedFiles({ name: args.name, slug: args.repo });
  let wrote = 0;
  for (const file of files) {
    try {
      await putFile({
        connectionName: args.connectionName,
        content: file.content,
        message: "tahcode 由来の足場を置く",
        owner: args.owner,
        path: file.path,
        repo: args.repo,
      });
      wrote += 1;
    } catch {
      // Keep going so one missing action does not hide a later success.
    }
  }
  if (wrote === 0) {
    throw new Error(
      "テンプレート足場を書けません。接続アプリの GitHub ファイル書き込みを確認してください"
    );
  }
};

export const provisionGithubViaOpenConnector = async (args: {
  connectionName: string;
  existingFullName?: string;
  name: string;
  slug: string;
}): Promise<{ repo: GitHubRepo; templateKind: TemplateKind }> => {
  if (args.existingFullName) {
    const [owner, repo] = args.existingFullName.split("/");
    if (owner && repo) {
      return {
        repo: await getRepo(args.connectionName, owner, repo),
        templateKind: "tahcode_seed",
      };
    }
  }
  const description = "ADHD Stack が tahcode 由来で用意したリポジトリ";
  const template = templateRepoFromEnv();
  if (template) {
    const repo = await createFromTemplate({
      connectionName: args.connectionName,
      description,
      name: args.slug,
      templateOwner: template.owner,
      templateRepo: template.repo,
    });
    return { repo, templateKind: "tahcode_template" };
  }
  const repo = await createRepo(args.connectionName, args.slug, description);
  await seedRepoViaOpenConnector({
    connectionName: args.connectionName,
    name: args.name,
    owner: repo.owner,
    repo: repo.repo,
  });
  return { repo, templateKind: "tahcode_seed" };
};
