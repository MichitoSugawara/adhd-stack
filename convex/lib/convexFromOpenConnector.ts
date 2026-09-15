import type { ConvexProjectTarget } from "./convexProject";
import { convexProjectFromPayload } from "./convexProject";
import { asList, asNumber, asRecord, asString } from "./httpJson";
import { findNamedOcConnection } from "./openConnector";
import {
  convexCreateProjectActionIds,
  convexCreateProjectInput,
  firstConvexTeamId,
} from "./openConnectorActionInputs";
import {
  invokeOpenConnectorAction,
  invokeOpenConnectorActionIds,
  proxyOpenConnector,
} from "./openConnectorActions";
import { extractPayloadItems } from "./openConnectorParse";

const envAction = (key: string, fallback: string): string =>
  process.env[key]?.trim() || fallback;

const teamIdFromPayload = (
  payload: Record<string, unknown>
): number | undefined => {
  const team = asRecord(payload.team);
  return (
    asNumber(payload.teamId) ??
    asNumber(payload.team_id) ??
    asNumber(team.id) ??
    asNumber(team.teamId)
  );
};

const projectFromUnknown = (
  teamId: string,
  value: unknown
): ConvexProjectTarget | undefined => {
  const direct = convexProjectFromPayload(teamId, value);
  if (direct) {
    return direct;
  }
  const record = asRecord(value);
  return convexProjectFromPayload(teamId, asRecord(record.project));
};

const projectsFromPayload = (
  teamId: string,
  payload: Record<string, unknown>
): ConvexProjectTarget[] => {
  const rows = [
    ...extractPayloadItems(payload),
    ...asList(payload.projects),
    ...asList(payload.items),
  ];
  const parsed: ConvexProjectTarget[] = [];
  for (const row of rows) {
    const project = projectFromUnknown(teamId, row);
    if (project) {
      parsed.push(project);
    }
  }
  const single = projectFromUnknown(teamId, payload);
  if (single) {
    parsed.push(single);
  }
  return parsed;
};

const resolveConvexTeamIdViaOpenConnector = async (args: {
  accountHints: readonly string[];
  connectionName: string;
}): Promise<number> => {
  let namedAccount = "";
  let namedId = "";
  try {
    const named = await findNamedOcConnection("convex", args.connectionName);
    namedAccount = named?.accountId ?? "";
    namedId = named?.id ?? "";
  } catch {
    // Stored hints and get_token_details can still supply team_id.
  }
  const fromHints = firstConvexTeamId([
    namedAccount,
    namedId,
    ...args.accountHints,
  ]);
  if (fromHints !== undefined) {
    return fromHints;
  }
  try {
    const details = await invokeOpenConnectorAction({
      actionId: envAction(
        "OPENCONNECTOR_CONVEX_TOKEN_DETAILS_ACTION",
        "convex.get_token_details"
      ),
      connectionName: args.connectionName,
      input: {},
    });
    const teamId = teamIdFromPayload(details);
    if (teamId !== undefined) {
      return teamId;
    }
  } catch {
    // Fall through to a clear error; create_project cannot run without team_id.
  }
  throw new Error("Convex チームを特定できませんでした");
};

const listConvexProjectViaOpenConnector = async (args: {
  connectionName: string;
  projectName: string;
  teamId: number;
}): Promise<ConvexProjectTarget | undefined> => {
  const teamId = String(args.teamId);
  try {
    const payload = await invokeOpenConnectorActionIds({
      actionIds: [
        envAction("OPENCONNECTOR_CONVEX_LIST_PROJECTS_ACTION", ""),
        "convex.list_projects",
      ],
      connectionName: args.connectionName,
      input: { team_id: args.teamId },
    });
    return projectsFromPayload(teamId, payload).find(
      (row) => row.projectSlug === args.projectName
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("unknown_action:")) {
      return undefined;
    }
  }
  try {
    const proxied = await proxyOpenConnector({
      connectionName: args.connectionName,
      endpoint: `/teams/${encodeURIComponent(teamId)}/projects?limit=100&q=${encodeURIComponent(args.projectName)}`,
      method: "GET",
      service: "convex",
    });
    return projectsFromPayload(teamId, proxied.data).find(
      (row) => row.projectSlug === args.projectName
    );
  } catch {
    return undefined;
  }
};

export const ensureConvexProjectViaOpenConnector = async (args: {
  accountHints?: readonly string[];
  connectionName: string;
  projectName: string;
}): Promise<ConvexProjectTarget> => {
  const teamId = await resolveConvexTeamIdViaOpenConnector({
    accountHints: args.accountHints ?? [],
    connectionName: args.connectionName,
  });
  const existing = await listConvexProjectViaOpenConnector({
    connectionName: args.connectionName,
    projectName: args.projectName,
    teamId,
  });
  if (existing) {
    return existing;
  }
  try {
    const payload = await invokeOpenConnectorActionIds({
      actionIds: [
        ...convexCreateProjectActionIds,
        envAction("OPENCONNECTOR_CONVEX_CREATE_PROJECT_ACTION", ""),
      ],
      connectionName: args.connectionName,
      input: convexCreateProjectInput({
        projectName: args.projectName,
        teamId,
      }),
    });
    const created =
      projectFromUnknown(String(teamId), payload) ??
      convexProjectFromPayload(String(teamId), {
        slug: args.projectName,
        ...payload,
      });
    if (created) {
      return created;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("unknown_action:")) {
      const again = await listConvexProjectViaOpenConnector({
        connectionName: args.connectionName,
        projectName: args.projectName,
        teamId,
      });
      if (again) {
        return again;
      }
      throw error;
    }
  }
  const proxied = await proxyOpenConnector({
    body: {
      deploymentType: "prod",
      projectName: args.projectName,
    },
    connectionName: args.connectionName,
    endpoint: `/teams/${encodeURIComponent(String(teamId))}/create_project`,
    method: "POST",
    service: "convex",
  });
  if (proxied.status >= 400) {
    const again = await listConvexProjectViaOpenConnector({
      connectionName: args.connectionName,
      projectName: args.projectName,
      teamId,
    });
    if (again) {
      return again;
    }
    throw new Error(
      asString(proxied.data.message) ??
        "Convex プロジェクトを作成できませんでした"
    );
  }
  return (
    projectFromUnknown(String(teamId), proxied.data) ?? {
      projectSlug: args.projectName,
      teamId: String(teamId),
    }
  );
};
