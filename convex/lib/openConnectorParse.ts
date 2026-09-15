import { asRecord, asString } from "./httpJson";

export interface OcConnectionSummary {
  accountId: string;
  connectionName: string;
  displayName: string;
  id: string;
  service: string;
}

const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const text = asString(value);
    if (text) {
      return text;
    }
  }
  return undefined;
};

const pushArray = (target: unknown[], value: unknown): void => {
  if (Array.isArray(value)) {
    target.push(...value);
  }
};

export const extractPayloadItems = (
  payload: Record<string, unknown>
): unknown[] => {
  const items: unknown[] = [];
  pushArray(items, payload.connections);
  if (items.length > 0) {
    return items;
  }
  pushArray(items, payload.items);
  if (items.length > 0) {
    return items;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  const nested = asRecord(payload.data);
  pushArray(items, nested.connections);
  if (items.length > 0) {
    return items;
  }
  pushArray(items, nested.items);
  return items;
};

export const parseOcConnection = (
  value: unknown
): OcConnectionSummary | null => {
  const row = asRecord(value);
  const nested = asRecord(row.profile);
  const data = asRecord(row.data);
  const service = firstString(
    row.service,
    row.provider,
    nested.service,
    data.service
  );
  const id = firstString(
    row.id,
    row.connectedAccountId,
    nested.id,
    data.id,
    row.accountId,
    nested.accountId
  );
  if (!(service && id)) {
    return null;
  }
  const connectionName =
    firstString(
      row.connectionName,
      row.name,
      row.alias,
      nested.connectionName,
      data.connectionName
    ) ?? "default";
  const accountId =
    firstString(row.accountId, nested.accountId, data.accountId, id) ?? id;
  const displayName =
    firstString(
      row.displayName,
      row.displayLabel,
      nested.displayName,
      data.displayName,
      accountId
    ) ?? accountId;
  return { accountId, connectionName, displayName, id, service };
};

export const parseOcConnectionList = (
  payload: Record<string, unknown>
): OcConnectionSummary[] => {
  const parsed: OcConnectionSummary[] = [];
  for (const item of extractPayloadItems(payload)) {
    const row = parseOcConnection(item);
    if (row) {
      parsed.push(row);
    }
  }
  return parsed;
};

export const findOcConnection = (
  connections: readonly OcConnectionSummary[],
  service: string,
  connectionName: string
): OcConnectionSummary | null => {
  const exact = connections.find(
    (row) => row.service === service && row.connectionName === connectionName
  );
  if (exact) {
    return exact;
  }
  return null;
};

export const parseAuthorizationUrl = (
  payload: Record<string, unknown>
): string | undefined => {
  const data = asRecord(payload.data);
  return firstString(
    payload.authorizationUrl,
    payload.url,
    data.authorizationUrl,
    data.url
  );
};

const configLooksReady = (row: Record<string, unknown>): boolean => {
  if (row.configured === true || row.hasClient === true) {
    return true;
  }
  if (row.configured === false || row.hasClient === false) {
    return false;
  }
  return Boolean(firstString(row.clientId, row.client_id));
};

export const oauthConfigIsReady = (
  payload: Record<string, unknown>,
  service: string
): boolean | undefined => {
  const items = extractPayloadItems(payload);
  if (items.length === 0) {
    const row = asRecord(payload.data);
    const name = firstString(row.service, payload.service, row.provider);
    if (name === service) {
      return configLooksReady(row);
    }
    if (firstString(payload.clientId, row.clientId)) {
      return configLooksReady({ ...payload, ...row });
    }
    return undefined;
  }
  const match = items
    .map((item) => asRecord(item))
    .find((row) => firstString(row.service, row.provider) === service);
  if (!match) {
    return false;
  }
  return configLooksReady(match);
};

const FORBIDDEN_ERROR = [
  /openconnector/iu,
  /oomol/iu,
  /workers\.dev/iu,
  /gateway/iu,
  /ゲートウェイ/u,
];

export const publicConnectError = (
  error: unknown,
  fallback: string
): string => {
  const raw = error instanceof Error ? error.message : fallback;
  if (FORBIDDEN_ERROR.some((pattern) => pattern.test(raw))) {
    return fallback;
  }
  return raw;
};
