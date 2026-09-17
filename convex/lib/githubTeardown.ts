import type { ConnectorOrToken } from "./actionAuth";
import type { CascadeResourceResult } from "./cascadeDeleteResult";
import { githubHeaders } from "./githubRepo";
import { asString, readJson } from "./httpJson";
import {
  githubDeleteRepositoryActionIds,
  githubDeleteRepositoryInput,
} from "./openConnectorActionInputs";
import {
  invokeOpenConnectorActionIds,
  proxyOpenConnector,
} from "./openConnectorActions";
import { reconnectMessage } from "./tokenRefresh";

const githubFail = (detail?: string): CascadeResourceResult => ({
  kind: "github_repo",
  message:
    detail && detail.length > 0
      ? `保存先を消せませんでした。${detail}`
      : "保存先を消せませんでした。つなぎ直してから、もう一度試してください",
  reconnect: true,
  status: "failed",
});

const githubFromStatus = (status: number): CascadeResourceResult => {
  if (status === 204 || status === 200) {
    return {
      kind: "github_repo",
      message: "保存先を消しました",
      reconnect: false,
      status: "deleted",
    };
  }
  if (status === 404) {
    return {
      kind: "github_repo",
      message: "保存先はすでにありませんでした",
      reconnect: false,
      status: "already_gone",
    };
  }
  if (status === 403) {
    return githubFail(
      "消す権限が足りません。GitHub をつなぎ直してから、もう一度試してください"
    );
  }
  return githubFail(`HTTP ${String(status)}`);
};

const deleteViaToken = async (args: {
  owner: string;
  repo: string;
  token: string;
}): Promise<CascadeResourceResult> => {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(args.owner)}/${encodeURIComponent(args.repo)}`,
    {
      headers: githubHeaders(args.token),
      method: "DELETE",
    }
  );
  if (response.status === 204 || response.status === 200) {
    return githubFromStatus(response.status);
  }
  const payload = await readJson(response);
  if (response.status === 404) {
    return githubFromStatus(404);
  }
  if (response.status === 403) {
    return githubFail(
      asString(payload.message) ??
        "消す権限が足りません。GitHub をつなぎ直してから、もう一度試してください"
    );
  }
  return githubFail(
    asString(payload.message) ?? `HTTP ${String(response.status)}`
  );
};

const deleteViaOpenConnector = async (args: {
  connectionName: string;
  owner: string;
  repo: string;
}): Promise<CascadeResourceResult> => {
  try {
    await invokeOpenConnectorActionIds({
      actionIds: githubDeleteRepositoryActionIds,
      connectionName: args.connectionName,
      input: githubDeleteRepositoryInput({
        owner: args.owner,
        repo: args.repo,
      }),
    });
    return githubFromStatus(204);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("unknown_action:")) {
      if (message.toLowerCase().includes("404")) {
        return githubFromStatus(404);
      }
      return githubFail(message);
    }
  }
  const proxied = await proxyOpenConnector({
    connectionName: args.connectionName,
    endpoint: `/repos/${encodeURIComponent(args.owner)}/${encodeURIComponent(args.repo)}`,
    method: "DELETE",
    service: "github",
  });
  return githubFromStatus(proxied.status);
};

export const deleteGitHubRepo = async (args: {
  auth: ConnectorOrToken | null;
  owner: string;
  repo: string;
}): Promise<CascadeResourceResult> => {
  if (!args.auth) {
    return {
      kind: "github_repo",
      message: reconnectMessage("github"),
      reconnect: true,
      status: "failed",
    };
  }
  if (args.auth.mode === "token") {
    return await deleteViaToken({
      owner: args.owner,
      repo: args.repo,
      token: args.auth.token,
    });
  }
  try {
    return await deleteViaOpenConnector({
      connectionName: args.auth.connectionName,
      owner: args.owner,
      repo: args.repo,
    });
  } catch (error) {
    return githubFail(error instanceof Error ? error.message : undefined);
  }
};
