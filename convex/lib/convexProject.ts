import { asList, asNumber, asRecord, asString, readJson } from "./httpJson";

export const convexProjectName = (slug: string): string => slug.slice(0, 64);

export interface ConvexProjectTarget {
  deploymentName?: string;
  projectSlug: string;
  teamId: string;
  teamSlug?: string;
  url?: string;
}

const headersFor = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

const request = async (
  token: string,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{
  ok: boolean;
  payload: Record<string, unknown>;
  status: number;
}> => {
  const response = await fetch(`https://api.convex.dev/v1${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: headersFor(token),
    method,
  });
  return {
    ok: response.ok,
    payload: await readJson(response),
    status: response.status,
  };
};

export const resolveConvexTeamId = async (token: string): Promise<string> => {
  const details = await request(token, "GET", "/token_details");
  if (details.ok) {
    const teamId = asNumber(details.payload.teamId);
    if (teamId !== undefined) {
      return String(teamId);
    }
  }
  const [prefix] = token.split("|");
  if (prefix && prefix !== token) {
    return prefix;
  }
  throw new Error("Convex チームを特定できませんでした");
};

export const convexProjectFromPayload = (
  teamId: string,
  value: unknown
): ConvexProjectTarget | undefined => {
  const row = asRecord(value);
  const nested = asRecord(row.project);
  const data = asRecord(row.data);
  let source = row;
  if (Object.keys(nested).length > 0) {
    source = nested;
  } else if (Object.keys(data).length > 0) {
    source = data;
  }
  const projectSlug =
    asString(source.slug) ??
    asString(source.projectSlug) ??
    asString(row.slug) ??
    asString(row.projectSlug);
  if (!projectSlug) {
    return undefined;
  }
  return {
    deploymentName:
      asString(source.prodDeploymentName) ??
      asString(source.deploymentName) ??
      asString(row.prodDeploymentName) ??
      asString(row.deploymentName),
    projectSlug,
    teamId,
    teamSlug: asString(source.teamSlug) ?? asString(row.teamSlug),
    url:
      asString(source.deploymentUrl) ??
      asString(source.prodUrl) ??
      asString(source.url) ??
      asString(row.deploymentUrl) ??
      asString(row.prodUrl) ??
      asString(row.url),
  };
};

export const ensureConvexProject = async (
  token: string,
  projectName: string
): Promise<ConvexProjectTarget> => {
  const teamId = await resolveConvexTeamId(token);
  const listed = await request(
    token,
    "GET",
    `/teams/${encodeURIComponent(teamId)}/projects?limit=100&q=${encodeURIComponent(projectName)}`
  );
  if (listed.ok) {
    const rows = asList(listed.payload.projects ?? listed.payload.items);
    const match = rows
      .map((row) => convexProjectFromPayload(teamId, row))
      .find((row) => row?.projectSlug === projectName);
    if (match) {
      return match;
    }
  }
  const created = await request(
    token,
    "POST",
    `/teams/${encodeURIComponent(teamId)}/create_project`,
    {
      deploymentType: "prod",
      projectName,
    }
  );
  if (created.ok) {
    const project = convexProjectFromPayload(teamId, created.payload);
    if (project) {
      return project;
    }
  }
  const legacy = await fetch("https://api.convex.dev/v1/create_project", {
    body: JSON.stringify({
      projectName,
      team: "default",
    }),
    headers: headersFor(token),
    method: "POST",
  });
  const legacyPayload = await readJson(legacy);
  if (legacy.ok) {
    return {
      deploymentName: asString(legacyPayload.deploymentName),
      projectSlug:
        asString(legacyPayload.projectSlug) ??
        asString(legacyPayload.slug) ??
        projectName,
      teamId,
      teamSlug: asString(legacyPayload.team),
      url:
        asString(legacyPayload.prodUrl) ??
        asString(legacyPayload.deploymentUrl) ??
        asString(legacyPayload.projectUrl),
    };
  }
  throw new Error(
    asString(created.payload.message) ??
      asString(legacyPayload.message) ??
      "Convex プロジェクトを作成できませんでした"
  );
};

export const getConvexProductionDeployment = async (
  token: string,
  teamId: string,
  projectSlug: string
): Promise<{ name?: string; url?: string }> => {
  const response = await request(
    token,
    "GET",
    `/teams/${encodeURIComponent(teamId)}/projects/${encodeURIComponent(projectSlug)}/deployment?defaultProd=true`
  );
  if (!response.ok) {
    return {};
  }
  return {
    name:
      asString(response.payload.deploymentName) ??
      asString(response.payload.name),
    url:
      asString(response.payload.deploymentUrl) ??
      asString(response.payload.url),
  };
};
