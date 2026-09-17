import { asRecord, asString, readJson } from "./httpJson";
import { fetchWithTimeout, OPENCONNECTOR_FETCH_TIMEOUT_MS } from "./httpRetry";
import type { OcConnectionSummary } from "./openConnectorParse";
import {
  findOcConnection,
  oauthConfigIsReady,
  parseAuthorizationUrl,
  parseOcConnectionList,
  publicConnectError,
} from "./openConnectorParse";
import type { ProviderId } from "./providers";

export const OPEN_CONNECTOR_SERVICES = ["github", "convex"] as const;

export type OpenConnectorService = (typeof OPEN_CONNECTOR_SERVICES)[number];

export const isOpenConnectorService = (
  provider: ProviderId
): provider is OpenConnectorService =>
  provider === "github" || provider === "convex";

const requireAdmin = (): { baseUrl: string; token: string } => {
  const baseUrl = process.env.OPENCONNECTOR_BASE_URL?.trim().replace(
    /\/$/u,
    ""
  );
  const token = process.env.OPENCONNECTOR_ADMIN_TOKEN?.trim();
  if (!(baseUrl && token)) {
    throw new Error("oauth_not_configured: 接続アプリが未設定です");
  }
  return { baseUrl, token };
};

const adminFetch = async (
  path: string,
  init: RequestInit = {}
): Promise<Record<string, unknown>> => {
  const { baseUrl, token } = requireAdmin();
  const headers = new Headers(init.headers);
  headers.set("authorization", `Bearer ${token}`);
  if (!headers.has("content-type") && init.body) {
    headers.set("content-type", "application/json");
  }
  const response = await fetchWithTimeout(
    `${baseUrl}${path}`,
    {
      ...init,
      headers,
    },
    OPENCONNECTOR_FETCH_TIMEOUT_MS
  );
  const payload = await readJson(response);
  if (!response.ok) {
    const detail =
      asString(payload.message) ??
      asString(payload.error) ??
      asString(asRecord(payload.data).message);
    throw new Error(
      publicConnectError(
        new Error(detail ?? `request_failed_${String(response.status)}`),
        "接続の開始に失敗しました"
      )
    );
  }
  return payload;
};

const shouldRetryUnknownAuthorizationField = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return (
    message.includes("returnuri") ||
    message.includes("requestedscope") ||
    message.includes("unknown") ||
    message.includes("extra") ||
    message.includes("unexpected")
  );
};

export const startOauthAuthorization = async (args: {
  connectionName: string;
  requestedScopes?: readonly string[];
  returnUri?: string;
  service: OpenConnectorService;
}): Promise<{ authorizationUrl: string; returnUriAccepted: boolean }> => {
  const body: Record<string, unknown> = {
    connectionName: args.connectionName,
    service: args.service,
  };
  if (args.returnUri) {
    body.returnUri = args.returnUri;
  }
  if (args.requestedScopes && args.requestedScopes.length > 0) {
    body.requestedScopes = [...args.requestedScopes];
  }
  try {
    const payload = await adminFetch("/api/oauth/authorizations", {
      body: JSON.stringify(body),
      method: "POST",
    });
    const authorizationUrl = parseAuthorizationUrl(payload);
    if (!authorizationUrl) {
      throw new Error("認可 URL が返りませんでした");
    }
    return {
      authorizationUrl,
      returnUriAccepted: Boolean(args.returnUri),
    };
  } catch (error) {
    if (
      args.requestedScopes &&
      args.requestedScopes.length > 0 &&
      shouldRetryUnknownAuthorizationField(error)
    ) {
      return await startOauthAuthorization({
        connectionName: args.connectionName,
        returnUri: args.returnUri,
        service: args.service,
      });
    }
    if (args.returnUri && shouldRetryUnknownAuthorizationField(error)) {
      return await startOauthAuthorization({
        connectionName: args.connectionName,
        requestedScopes: args.requestedScopes,
        service: args.service,
      });
    }
    throw new Error(publicConnectError(error, "接続の開始に失敗しました"), {
      cause: error,
    });
  }
};

export const listOcConnections = async (): Promise<OcConnectionSummary[]> => {
  const payload = await adminFetch("/api/connections");
  return parseOcConnectionList(payload);
};

export const findNamedOcConnection = async (
  service: OpenConnectorService,
  connectionName: string
): Promise<OcConnectionSummary | null> => {
  const connections = await listOcConnections();
  return findOcConnection(connections, service, connectionName);
};

export const deleteOcConnection = async (
  service: OpenConnectorService,
  connectionName: string
): Promise<void> => {
  const encoded = encodeURIComponent(connectionName);
  try {
    await adminFetch(`/api/connections/${service}?connectionName=${encoded}`, {
      method: "DELETE",
    });
  } catch {
    await adminFetch(`/api/connections/${service}`, { method: "DELETE" });
  }
};

const throwIfOauthMissing = (ready: boolean | undefined): void => {
  if (ready === false) {
    throw new Error("oauth_not_configured: 接続アプリが未設定です");
  }
};

export const assertOauthAppReady = async (
  service: OpenConnectorService
): Promise<void> => {
  try {
    const payload = await adminFetch("/api/oauth/configs");
    throwIfOauthMissing(oauthConfigIsReady(payload, service));
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("oauth_not_configured:")) {
      throw error;
    }
  }
  try {
    const single = await adminFetch(`/api/oauth/configs/${service}`);
    throwIfOauthMissing(oauthConfigIsReady(single, service));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("oauth_not_configured:")) {
      throw error;
    }
  }
};

export const makeConnectionName = (
  service: OpenConnectorService,
  ownerKey: string
): string => {
  const safeOwner = ownerKey.replaceAll(/[^a-zA-Z0-9_-]/gu, "").slice(0, 24);
  const nonce = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `adhd-${safeOwner || "pending"}-${nonce}-${service}`;
};
