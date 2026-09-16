import { loadProviderIdentity } from "./oauthExchange";
import type { TokenSet } from "./oauthExchange";

export const CODEX_PUBLIC_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export const CODEX_ISSUER = "https://auth.openai.com";
export const CODEX_USERCODE_URL = `${CODEX_ISSUER}/api/accounts/deviceauth/usercode`;
export const CODEX_TOKEN_POLL_URL = `${CODEX_ISSUER}/api/accounts/deviceauth/token`;
export const CODEX_OAUTH_TOKEN_URL = `${CODEX_ISSUER}/oauth/token`;
export const CODEX_DEVICE_REDIRECT_URI = `${CODEX_ISSUER}/deviceauth/callback`;
export const CODEX_VERIFICATION_URL = `${CODEX_ISSUER}/codex/device`;
export const CODEX_DEVICE_TIMEOUT_MS = 15 * 60 * 1000;
export const CODEX_DEFAULT_INTERVAL_SECONDS = 5;

export interface CodexDeviceStart {
  deviceAuthId: string;
  intervalSeconds: number;
  userCode: string;
  verificationUrl: string;
  verificationUrlFallback: string;
}

export const buildCodexVerificationUrl = (userCode: string): string => {
  const trimmed = userCode.trim();
  if (trimmed.length === 0) {
    return CODEX_VERIFICATION_URL;
  }
  const url = new URL(CODEX_VERIFICATION_URL);
  url.searchParams.set("user_code", trimmed);
  return url.toString();
};

export interface CodexDeviceCodes {
  authorizationCode: string;
  codeVerifier: string;
}

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const parseIntervalSeconds = (value: unknown): number => {
  const raw = typeof value === "number" ? value : Number(asString(value));
  if (!Number.isFinite(raw) || raw <= 0) {
    return CODEX_DEFAULT_INTERVAL_SECONDS;
  }
  return Math.max(Math.floor(raw), 1);
};

const readJson = async (
  response: Response
): Promise<Record<string, unknown>> => {
  const text = await response.text();
  if (text.length === 0) {
    return {};
  }
  try {
    return asRecord(JSON.parse(text));
  } catch {
    return {};
  }
};

export const requestCodexUserCode = async (): Promise<CodexDeviceStart> => {
  const response = await fetch(CODEX_USERCODE_URL, {
    body: JSON.stringify({ client_id: CODEX_PUBLIC_CLIENT_ID }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  const payload = await readJson(response);
  if (!response.ok) {
    throw new Error(
      `ChatGPT のデバイスログインを開始できませんでした: HTTP ${response.status}`
    );
  }
  const userCode = asString(payload.user_code) ?? asString(payload.usercode);
  const deviceAuthId = asString(payload.device_auth_id);
  if (!(userCode && deviceAuthId)) {
    throw new Error("ChatGPT のデバイスコードを取得できませんでした");
  }
  return {
    deviceAuthId,
    intervalSeconds: parseIntervalSeconds(payload.interval),
    userCode,
    verificationUrl: buildCodexVerificationUrl(userCode),
    verificationUrlFallback: CODEX_VERIFICATION_URL,
  };
};

export const pollCodexDeviceOnce = async (
  deviceAuthId: string,
  userCode: string
): Promise<CodexDeviceCodes | "pending"> => {
  const response = await fetch(CODEX_TOKEN_POLL_URL, {
    body: JSON.stringify({
      device_auth_id: deviceAuthId,
      user_code: userCode,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
  if (response.status === 403 || response.status === 404) {
    return "pending";
  }
  if (!response.ok) {
    throw new Error(
      `ChatGPT のデバイス確認に失敗しました: HTTP ${response.status}`
    );
  }
  const payload = await readJson(response);
  const authorizationCode = asString(payload.authorization_code);
  const codeVerifier = asString(payload.code_verifier);
  if (!(authorizationCode && codeVerifier)) {
    throw new Error("ChatGPT の認可コードを受け取れませんでした");
  }
  return { authorizationCode, codeVerifier };
};

export const exchangeCodexDeviceCode = async (
  authorizationCode: string,
  codeVerifier: string
): Promise<TokenSet> => {
  const body = new URLSearchParams({
    client_id: CODEX_PUBLIC_CLIENT_ID,
    code: authorizationCode,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: CODEX_DEVICE_REDIRECT_URI,
  });
  const response = await fetch(CODEX_OAUTH_TOKEN_URL, {
    body,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });
  const payload = await readJson(response);
  const accessToken = asString(payload.access_token);
  if (!response.ok || !accessToken) {
    const detail =
      asString(payload.error_description) ??
      asString(payload.error) ??
      `HTTP ${response.status}`;
    throw new Error(`ChatGPT のトークン交換に失敗しました: ${detail}`);
  }
  const expiresIn =
    typeof payload.expires_in === "number"
      ? payload.expires_in
      : Number(asString(payload.expires_in));
  return {
    accessToken,
    expiresAt: Number.isFinite(expiresIn)
      ? Date.now() + expiresIn * 1000
      : undefined,
    idToken: asString(payload.id_token),
    refreshToken: asString(payload.refresh_token),
  };
};

export const identityFromCodexTokens = async (tokens: TokenSet) =>
  await loadProviderIdentity("chatgpt", tokens);
