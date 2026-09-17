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

export const GITHUB_DELETE_PERMISSION_MESSAGE =
  "リポジトリを消す権限がありません。GitHub をつなぎ直し、削除権限（delete_repo / 管理者）を許可してください";

export const isGitHubDeletePermissionError = (
  status?: number,
  detail?: string
): boolean => {
  if (status === 403) {
    return true;
  }
  const lower = (detail ?? "").toLowerCase();
  return (
    lower.includes("must have admin rights") ||
    lower.includes("admin rights to repository") ||
    /(?:^|[^a-z_])delete_repo(?:[^a-z_]|$)/u.test(lower)
  );
};

const githubFail = (detail?: string): CascadeResourceResult => ({
  kind: "github_repo",
  message:
    detail && detail.length > 0
      ? `保存先を消せませんでした。${detail}`
      : "保存先を消せませんでした。つなぎ直してから、もう一度試してください",
  reconnect: true,
  status: "failed",
});

const githubPermissionFail = (): CascadeResourceResult =>
  githubFail(GITHUB_DELETE_PERMISSION_MESSAGE);

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
    return githubPermissionFail();
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
    return githubPermissionFail();
  }
  const detail = asString(payload.message);
  if (isGitHubDeletePermissionError(response.status, detail)) {
    return githubPermissionFail();
  }
  return githubFail(detail ?? `HTTP ${String(response.status)}`);
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
      if (isGitHubDeletePermissionError(undefined, message)) {
        return githubPermissionFail();
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
    const message = error instanceof Error ? error.message : undefined;
    if (isGitHubDeletePermissionError(undefined, message)) {
      return githubPermissionFail();
    }
    return githubFail(message);
  }
};
