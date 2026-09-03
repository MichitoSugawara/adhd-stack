import { CODEX_OAUTH_TOKEN_URL, CODEX_PUBLIC_CLIENT_ID } from "./codexDevice";
import { asNumber, asString, readJson } from "./httpJson";
import { getProviderDefinition, requireProviderEnv } from "./providers";
import type { ProviderId } from "./providers";

export interface StoredConnectionSecret {
  accessToken: string;
  accountId: string;
  expiresAt?: number;
  identity: string;
  refreshToken?: string;
}

export interface FreshTokens {
  accessToken: string;
  expiresAt?: number;
  refreshToken?: string;
}

const TOKEN_SKEW_MS = 60_000;

export const needsRefresh = (expiresAt?: number): boolean => {
  if (expiresAt === undefined) {
    return false;
  }
  return Date.now() >= expiresAt - TOKEN_SKEW_MS;
};

const tokensFromPayload = (
  payload: Record<string, unknown>,
  previous: StoredConnectionSecret
): FreshTokens | undefined => {
  const accessToken = asString(payload.access_token);
  if (!accessToken) {
    return undefined;
  }
  const expiresIn = asNumber(payload.expires_in);
  return {
    accessToken,
    expiresAt:
      expiresIn === undefined
        ? previous.expiresAt
        : Date.now() + expiresIn * 1000,
    refreshToken: asString(payload.refresh_token) ?? previous.refreshToken,
  };
};

export const refreshChatgptTokens = async (
  previous: StoredConnectionSecret
): Promise<FreshTokens | undefined> => {
  if (!previous.refreshToken) {
    return undefined;
  }
  const response = await fetch(CODEX_OAUTH_TOKEN_URL, {
    body: new URLSearchParams({
      client_id: CODEX_PUBLIC_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: previous.refreshToken,
    }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const payload = await readJson(response);
  if (!response.ok) {
    return undefined;
  }
  return tokensFromPayload(payload, previous);
};

export const refreshOAuthTokens = async (
  provider: Exclude<ProviderId, "chatgpt">,
  previous: StoredConnectionSecret
): Promise<FreshTokens | undefined> => {
  if (!previous.refreshToken) {
    return undefined;
  }
  const env = requireProviderEnv(provider);
  const definition = getProviderDefinition(provider);
  const response = await fetch(definition.tokenUrl, {
    body: new URLSearchParams({
      client_id: env.clientId,
      client_secret: env.clientSecret,
      grant_type: "refresh_token",
      refresh_token: previous.refreshToken,
    }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const payload = await readJson(response);
  if (!response.ok) {
    return undefined;
  }
  return tokensFromPayload(payload, previous);
};

export const refreshConnectionTokens = async (
  provider: ProviderId,
  previous: StoredConnectionSecret
): Promise<FreshTokens | undefined> => {
  if (!needsRefresh(previous.expiresAt) && previous.accessToken.length > 0) {
    return undefined;
  }
  if (provider === "chatgpt") {
    return await refreshChatgptTokens(previous);
  }
  return await refreshOAuthTokens(provider, previous);
};
