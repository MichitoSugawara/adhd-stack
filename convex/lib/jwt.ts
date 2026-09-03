import { asRecord, asString } from "./httpJson";

export const decodeJwtPayload = (
  token: string
): Record<string, unknown> | undefined => {
  const [, payload] = token.split(".");
  if (!payload) {
    return undefined;
  }
  const normalized = payload.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  try {
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

export const looksLikeCfAccountId = (
  value: string | undefined
): value is string => Boolean(value && /^[a-f0-9]{32}$/iu.test(value));

export const isUsableCodexAccountId = (
  value: string | undefined
): value is string => {
  if (!value || value.length < 8) {
    return false;
  }
  return !(
    value.startsWith("chatgpt:") ||
    value.startsWith("github:") ||
    value.startsWith("cloudflare:") ||
    value.startsWith("convex:")
  );
};

export const chatgptAccountIdFromClaims = (
  claims: Record<string, unknown> | undefined
): string | undefined => {
  if (!claims) {
    return undefined;
  }
  const auth = asRecord(claims["https://api.openai.com/auth"]);
  const accountId =
    asString(auth.chatgpt_account_id) ?? asString(claims.chatgpt_account_id);
  return isUsableCodexAccountId(accountId) ? accountId : undefined;
};

export const chatgptAccountIdFromToken = (token: string): string | undefined =>
  chatgptAccountIdFromClaims(decodeJwtPayload(token));
