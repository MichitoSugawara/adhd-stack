import type { ConvexProjectTarget } from "./convexProject";
import {
  convexDeployKeyFromPayload,
  convexDeploymentNameForApi,
  convexProjectFromPayload,
} from "./convexProject";
import { asList, asNumber, asRecord, asString } from "./httpJson";
import { findNamedOcConnection } from "./openConnector";
import {
  convexCreateDeployKeyActionIds,
  convexCreateDeployKeyInput,
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

export const resolveConvexTeamIdViaOpenConnector = async (args: {
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

export const listConvexProjectViaOpenConnector = async (args: {
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

const deploymentFromUnknown = (
  value: unknown
): { name?: string; url?: string } => {
  const row = asRecord(value);
  const nested = asRecord(row.deployment);
  const source = Object.keys(nested).length > 0 ? nested : row;
  const name =
    asString(source.deploymentName) ??
    asString(source.prodDeploymentName) ??
    asString(source.name);
  const url =
    asString(source.deploymentUrl) ??
    asString(source.prodUrl) ??
    asString(source.url);
  return { name, url };
};

const urlFromDeploymentName = (name?: string): string | undefined => {
  if (!name || !/^[a-z0-9-]+$/iu.test(name)) {
    return undefined;
  }
  return `https://${name}.convex.cloud`;
};

const withDeploymentUrl = (
  project: ConvexProjectTarget,
  deployment: { name?: string; url?: string }
): ConvexProjectTarget => {
  const deploymentName = deployment.name ?? project.deploymentName;
  return {
    ...project,
    deploymentName,
    url: deployment.url ?? project.url ?? urlFromDeploymentName(deploymentName),
  };
};

export const getConvexProductionDeploymentViaOpenConnector = async (args: {
  connectionName: string;
  projectSlug: string;
  teamId: string;
}): Promise<{ name?: string; url?: string }> => {
  const teamId = Number(args.teamId);
  try {
    const payload = await invokeOpenConnectorActionIds({
      actionIds: [
        envAction("OPENCONNECTOR_CONVEX_LIST_DEPLOYMENTS_ACTION", ""),
        "convex.list_deployments",
      ],
      connectionName: args.connectionName,
      input: {
        projectSlug: args.projectSlug,
        ...(Number.isInteger(teamId) ? { team_id: teamId } : {}),
      },
    });
    const items = [
      ...extractPayloadItems(payload),
      ...asList(payload.deployments),
    ];
    const prod =
      items
        .map((item) => asRecord(item))
        .find((row) => {
          const kind =
            asString(row.kind) ??
            asString(row.deploymentType) ??
            asString(row.type);
          return kind === "prod" || row.isProd === true;
        }) ?? items[0];
    const parsed = deploymentFromUnknown(prod);
    if (parsed.url || parsed.name) {
      return {
        ...parsed,
        url: parsed.url ?? urlFromDeploymentName(parsed.name),
      };
    }
  } catch {
    // Fall through to get_project_by_slug / proxy.
  }
  try {
    const payload = await invokeOpenConnectorActionIds({
      actionIds: [
        envAction("OPENCONNECTOR_CONVEX_GET_PROJECT_ACTION", ""),
        "convex.get_project_by_slug",
      ],
      connectionName: args.connectionName,
      input: {
        projectSlug: args.projectSlug,
        ...(Number.isInteger(teamId) ? { team_id: teamId } : {}),
      },
    });
    const project = projectFromUnknown(args.teamId, payload);
    if (project?.url || project?.deploymentName) {
      return {
        name: project.deploymentName,
        url: project.url ?? urlFromDeploymentName(project.deploymentName),
      };
    }
  } catch {
    // Proxy the same management endpoint the token path uses.
  }
  try {
    const proxied = await proxyOpenConnector({
      connectionName: args.connectionName,
      endpoint: `/teams/${encodeURIComponent(args.teamId)}/projects/${encodeURIComponent(args.projectSlug)}/deployment?defaultProd=true`,
      method: "GET",
      service: "convex",
    });
    const parsed = deploymentFromUnknown(proxied.data);
    return {
      ...parsed,
      url: parsed.url ?? urlFromDeploymentName(parsed.name),
    };
  } catch {
    return {};
  }
};

const attachConvexDeployment = async (
  connectionName: string,
  project: ConvexProjectTarget
): Promise<ConvexProjectTarget> => {
  if (project.url) {
    return project;
  }
  const deployment = await getConvexProductionDeploymentViaOpenConnector({
    connectionName,
    projectSlug: project.projectSlug,
    teamId: project.teamId,
  });
  return withDeploymentUrl(project, deployment);
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
    return await attachConvexDeployment(args.connectionName, existing);
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
      return await attachConvexDeployment(args.connectionName, created);
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
        return await attachConvexDeployment(args.connectionName, again);
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
      return await attachConvexDeployment(args.connectionName, again);
    }
    throw new Error(
      asString(proxied.data.message) ??
        "Convex プロジェクトを作成できませんでした"
    );
  }
  return await attachConvexDeployment(
    args.connectionName,
    projectFromUnknown(String(teamId), proxied.data) ?? {
      projectSlug: args.projectName,
      teamId: String(teamId),
    }
  );
};

export const createConvexDeployKeyViaOpenConnector = async (args: {
  connectionName: string;
  deploymentName: string;
  name: string;
}): Promise<string> => {
  const deploymentName = convexDeploymentNameForApi(args.deploymentName);
  try {
    const payload = await invokeOpenConnectorActionIds({
      actionIds: [
        ...convexCreateDeployKeyActionIds,
        envAction("OPENCONNECTOR_CONVEX_CREATE_DEPLOY_KEY_ACTION", ""),
      ],
      connectionName: args.connectionName,
      input: convexCreateDeployKeyInput({
        deploymentName,
        name: args.name,
      }),
    });
    const deployKey = convexDeployKeyFromPayload(payload);
    if (deployKey) {
      return deployKey;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("unknown_action:")) {
      throw error;
    }
  }
  const proxied = await proxyOpenConnector({
    body: { name: args.name },
    connectionName: args.connectionName,
    endpoint: `/deployments/${encodeURIComponent(deploymentName)}/create_deploy_key`,
    method: "POST",
    service: "convex",
  });
  const deployKey = convexDeployKeyFromPayload(proxied.data);
  if (proxied.status >= 400 || !deployKey) {
    throw new Error(
      asString(proxied.data.message) ??
        "Convex デプロイキーを発行できませんでした"
    );
  }
  return deployKey;
};
