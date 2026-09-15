import { asList, asRecord, asString, payloadText, readJson } from "./httpJson";
import { looksLikeCfAccountId } from "./jwt";

export interface CloudflareJsonResponse {
  ok: boolean;
  payload: Record<string, unknown>;
  status: number;
}

const headersFor = (token: string): HeadersInit => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
});

export const isExpiredCloudflareToken = (
  status: number,
  payload: Record<string, unknown>
): boolean => {
  if (status !== 401 && status !== 403) {
    return false;
  }
  const text =
    `${payloadText(payload)} ${asString(payload.error) ?? ""}`.toLowerCase();
  // Cloudflare memberships often returns 403 "Authentication error" (code 10000)
  // when the OAuth token lacks that endpoint, not when the token is dead.
  return (
    text.includes("invalid_token") ||
    text.includes("token expired") ||
    text.includes("access token expired") ||
    text.includes("expired_token")
  );
};

export const accountIdFromMemberships = (
  payload: Record<string, unknown>
): string | undefined => {
  for (const item of asList(payload.result)) {
    const row = asRecord(item);
    const accountId =
      asString(asRecord(row.account).id) ?? asString(row.account_id);
    if (looksLikeCfAccountId(accountId)) {
      return accountId;
    }
  }
  return undefined;
};

export const accountIdFromAccounts = (
  payload: Record<string, unknown>
): string | undefined => {
  const first = asRecord(asList(payload.result)[0]);
  const accountId = asString(first.id);
  return looksLikeCfAccountId(accountId) ? accountId : undefined;
};

export const accountIdFromUserinfo = (
  payload: Record<string, unknown>
): string | undefined => {
  const accountId =
    asString(payload.account_id) ??
    asString(asRecord(asList(payload.accounts)[0]).id);
  return looksLikeCfAccountId(accountId) ? accountId : undefined;
};

export const pickCloudflareAccountId = (args: {
  accounts: CloudflareJsonResponse;
  hint?: string;
  memberships: CloudflareJsonResponse;
  userinfo: CloudflareJsonResponse;
}): string | undefined => {
  if (looksLikeCfAccountId(args.hint)) {
    return args.hint;
  }
  if (args.memberships.ok) {
    const fromMemberships = accountIdFromMemberships(args.memberships.payload);
    if (fromMemberships) {
      return fromMemberships;
    }
  }
  if (args.accounts.ok) {
    const fromAccounts = accountIdFromAccounts(args.accounts.payload);
    if (fromAccounts) {
      return fromAccounts;
    }
  }
  if (args.userinfo.ok) {
    return accountIdFromUserinfo(args.userinfo.payload);
  }
  return undefined;
};

const readCloudflare = async (
  fetcher: typeof fetch,
  url: string,
  token: string
): Promise<CloudflareJsonResponse> => {
  const response = await fetcher(url, { headers: headersFor(token) });
  return {
    ok: response.ok,
    payload: await readJson(response),
    status: response.status,
  };
};

export const resolveCloudflareAccountId = async (
  token: string,
  hint?: string,
  fetcher: typeof fetch = fetch
): Promise<
  | { accountId: string; ok: true }
  | {
      expired: boolean;
      ok: false;
      payload: Record<string, unknown>;
      status: number;
    }
> => {
  if (looksLikeCfAccountId(hint)) {
    return { accountId: hint, ok: true };
  }

  const memberships = await readCloudflare(
    fetcher,
    "https://api.cloudflare.com/client/v4/memberships",
    token
  );
  if (memberships.ok) {
    const accountId = accountIdFromMemberships(memberships.payload);
    if (accountId) {
      return { accountId, ok: true };
    }
  }

  const accounts = await readCloudflare(
    fetcher,
    "https://api.cloudflare.com/client/v4/accounts?per_page=1",
    token
  );
  if (accounts.ok) {
    const accountId = accountIdFromAccounts(accounts.payload);
    if (accountId) {
      return { accountId, ok: true };
    }
  }

  const userinfo = await readCloudflare(
    fetcher,
    "https://dash.cloudflare.com/oauth2/userinfo",
    token
  );
  if (userinfo.ok) {
    const accountId = accountIdFromUserinfo(userinfo.payload);
    if (accountId) {
      return { accountId, ok: true };
    }
  }

  const picked = pickCloudflareAccountId({
    accounts,
    hint,
    memberships,
    userinfo,
  });
  if (picked) {
    return { accountId: picked, ok: true };
  }

  return {
    expired:
      isExpiredCloudflareToken(accounts.status, accounts.payload) ||
      isExpiredCloudflareToken(userinfo.status, userinfo.payload),
    ok: false,
    payload: accounts.payload,
    status: accounts.status,
  };
};
