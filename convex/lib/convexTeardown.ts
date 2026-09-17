import type { ConnectorOrToken } from "./actionAuth";
import type { CascadeResourceResult } from "./cascadeDeleteResult";
import {
  listConvexProjectViaOpenConnector,
  resolveConvexTeamIdViaOpenConnector,
} from "./convexFromOpenConnector";
import {
  convexProjectFromPayload,
  convexProjectIdFromUnknown,
  resolveConvexTeamId,
} from "./convexProject";
import { asList, asString, readJson } from "./httpJson";
import {
  convexDeleteProjectActionIds,
  convexDeleteProjectInput,
  convexTeamIdFromAccount,
} from "./openConnectorActionInputs";
import {
  invokeOpenConnectorActionIds,
  proxyOpenConnector,
} from "./openConnectorActions";
import { reconnectMessage } from "./tokenRefresh";

const convexFail = (detail?: string): CascadeResourceResult => ({
  kind: "convex_project",
  message:
    detail && detail.length > 0
      ? `アプリのデータを消せませんでした。${detail}`
      : "アプリのデータを消せませんでした。つなぎ直してから、もう一度試してください",
  reconnect: true,
  status: "failed",
});

const request = async (
  token: string,
  method: string,
  path: string
): Promise<{
  ok: boolean;
  payload: Record<string, unknown>;
  status: number;
}> => {
  const response = await fetch(`https://api.convex.dev/v1${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method,
  });
  return {
    ok: response.ok,
    payload: await readJson(response),
    status: response.status,
  };
};

const projectIdFromList = (
  teamId: string,
  payload: Record<string, unknown>,
  projectSlug: string
): string | undefined => {
  const rows = [
    ...asList(payload.projects),
    ...asList(payload.items),
    ...asList(payload.data),
  ];
  for (const row of rows) {
    const parsed = convexProjectFromPayload(teamId, row);
    if (parsed?.projectSlug === projectSlug) {
      return parsed.projectId ?? convexProjectIdFromUnknown(row);
    }
  }
  return convexProjectIdFromUnknown(payload);
};

const resolveProjectIdWithToken = async (
  token: string,
  projectSlug: string,
  teamSlug?: string
): Promise<{ alreadyGone: boolean; projectId?: string }> => {
  const teamId = String(
    teamSlug
      ? (convexTeamIdFromAccount(teamSlug) ??
          (await resolveConvexTeamId(token)))
      : await resolveConvexTeamId(token)
  );
  const bySlug = await request(
    token,
    "GET",
    `/teams/${encodeURIComponent(teamId)}/projects/${encodeURIComponent(projectSlug)}`
  );
  if (bySlug.status === 404) {
    return { alreadyGone: true };
  }
  const fromSlug =
    convexProjectFromPayload(teamId, bySlug.payload)?.projectId ??
    convexProjectIdFromUnknown(bySlug.payload);
  if (bySlug.ok && fromSlug) {
    return { alreadyGone: false, projectId: fromSlug };
  }
  const listed = await request(
    token,
    "GET",
    `/teams/${encodeURIComponent(teamId)}/projects?limit=100&q=${encodeURIComponent(projectSlug)}`
  );
  if (listed.status === 404) {
    return { alreadyGone: true };
  }
  const fromList = projectIdFromList(teamId, listed.payload, projectSlug);
  if (listed.ok && fromList) {
    return { alreadyGone: false, projectId: fromList };
  }
  return { alreadyGone: false };
};

const deleteByProjectIdWithToken = async (
  token: string,
  projectId: string
): Promise<CascadeResourceResult> => {
  const response = await request(
    token,
    "POST",
    `/projects/${encodeURIComponent(projectId)}/delete`
  );
  if (response.ok || response.status === 200) {
    return {
      kind: "convex_project",
      message: "アプリのデータを消しました",
      reconnect: false,
      status: "deleted",
    };
  }
  if (response.status === 404) {
    return {
      kind: "convex_project",
      message: "アプリのデータはすでにありませんでした",
      reconnect: false,
      status: "already_gone",
    };
  }
  return convexFail(
    asString(response.payload.message) ?? `HTTP ${String(response.status)}`
  );
};

const deleteViaToken = async (args: {
  projectSlug: string;
  teamSlug?: string;
  token: string;
}): Promise<CascadeResourceResult> => {
  const resolved = await resolveProjectIdWithToken(
    args.token,
    args.projectSlug,
    args.teamSlug
  );
  if (resolved.alreadyGone) {
    return {
      kind: "convex_project",
      message: "アプリのデータはすでにありませんでした",
      reconnect: false,
      status: "already_gone",
    };
  }
  if (!resolved.projectId) {
    return convexFail("プロジェクト番号を特定できませんでした");
  }
  return await deleteByProjectIdWithToken(args.token, resolved.projectId);
};

const resolveProjectIdViaOpenConnector = async (args: {
  accountHints: readonly string[];
  connectionName: string;
  projectSlug: string;
  teamSlug?: string;
}): Promise<{ alreadyGone: boolean; projectId?: string; teamId?: number }> => {
  const hintTeam = args.teamSlug
    ? convexTeamIdFromAccount(args.teamSlug)
    : undefined;
  const teamId =
    hintTeam ??
    (await resolveConvexTeamIdViaOpenConnector({
      accountHints: args.accountHints,
      connectionName: args.connectionName,
    }));
  const listed = await listConvexProjectViaOpenConnector({
    connectionName: args.connectionName,
    projectName: args.projectSlug,
    teamId,
  });
  if (listed?.projectId) {
    return { alreadyGone: false, projectId: listed.projectId, teamId };
  }
  try {
    const proxied = await proxyOpenConnector({
      connectionName: args.connectionName,
      endpoint: `/teams/${encodeURIComponent(String(teamId))}/projects/${encodeURIComponent(args.projectSlug)}`,
      method: "GET",
      service: "convex",
    });
    if (proxied.status === 404) {
      return { alreadyGone: true, teamId };
    }
    const projectId =
      listed?.projectId ?? convexProjectIdFromUnknown(proxied.data);
    return { alreadyGone: false, projectId, teamId };
  } catch {
    return { alreadyGone: false, projectId: listed?.projectId, teamId };
  }
};

const deleteViaOpenConnector = async (args: {
  accountHints: readonly string[];
  connectionName: string;
  projectSlug: string;
  teamSlug?: string;
}): Promise<CascadeResourceResult> => {
  const resolved = await resolveProjectIdViaOpenConnector(args);
  if (resolved.alreadyGone) {
    return {
      kind: "convex_project",
      message: "アプリのデータはすでにありませんでした",
      reconnect: false,
      status: "already_gone",
    };
  }
  if (!resolved.projectId) {
    return convexFail("プロジェクト番号を特定できませんでした");
  }
  try {
    await invokeOpenConnectorActionIds({
      actionIds: convexDeleteProjectActionIds,
      connectionName: args.connectionName,
      input: convexDeleteProjectInput({ projectId: resolved.projectId }),
    });
    return {
      kind: "convex_project",
      message: "アプリのデータを消しました",
      reconnect: false,
      status: "deleted",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("unknown_action:")) {
      if (message.toLowerCase().includes("404")) {
        return {
          kind: "convex_project",
          message: "アプリのデータはすでにありませんでした",
          reconnect: false,
          status: "already_gone",
        };
      }
      return convexFail(message);
    }
  }
  const proxied = await proxyOpenConnector({
    connectionName: args.connectionName,
    endpoint: `/projects/${encodeURIComponent(resolved.projectId)}/delete`,
    method: "POST",
    service: "convex",
  });
  if (proxied.status === 404) {
    return {
      kind: "convex_project",
      message: "アプリのデータはすでにありませんでした",
      reconnect: false,
      status: "already_gone",
    };
  }
  if (proxied.status >= 400) {
    return convexFail(
      asString(proxied.data.message) ?? `HTTP ${String(proxied.status)}`
    );
  }
  return {
    kind: "convex_project",
    message: "アプリのデータを消しました",
    reconnect: false,
    status: "deleted",
  };
};

export const deleteConvexProject = async (args: {
  auth: ConnectorOrToken | null;
  projectSlug: string;
  teamSlug?: string;
}): Promise<CascadeResourceResult> => {
  if (!args.auth) {
    return {
      kind: "convex_project",
      message: reconnectMessage("convex"),
      reconnect: true,
      status: "failed",
    };
  }
  try {
    if (args.auth.mode === "token") {
      return await deleteViaToken({
        projectSlug: args.projectSlug,
        teamSlug: args.teamSlug,
        token: args.auth.token,
      });
    }
    return await deleteViaOpenConnector({
      accountHints: args.auth.accountHints,
      connectionName: args.auth.connectionName,
      projectSlug: args.projectSlug,
      teamSlug: args.teamSlug,
    });
  } catch (error) {
    return convexFail(error instanceof Error ? error.message : undefined);
  }
};
