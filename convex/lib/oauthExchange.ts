import { asList, asRecord, asString } from "./httpJson";
import {
  chatgptAccountIdFromClaims,
  chatgptAccountIdFromToken,
  decodeJwtPayload,
  looksLikeCfAccountId,
} from "./jwt";
import type { ProviderId } from "./providers";
import {
  getProviderDefinition,
  redirectUri,
  requireProviderEnv,
} from "./providers";

export interface TokenSet {
  accessToken: string;
  expiresAt?: number;
  idToken?: string;
  refreshToken?: string;
}

export interface ProviderIdentity {
  accountKey: string;
  connectionAccountId?: string;
  email?: string;
  identity: string;
  name?: string;
  planWarning?: string;
}

const readJson = async (
  response: Response
): Promise<Record<string, unknown>> => {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const params = new URLSearchParams(text);
    return Object.fromEntries(params.entries());
  }
};

export const exchangeAuthorizationCode = async (
  provider: ProviderId,
  code: string,
  codeVerifier: string
): Promise<TokenSet> => {
  const env = requireProviderEnv(provider);
  const definition = getProviderDefinition(provider);
  const body = new URLSearchParams({
    client_id: env.clientId,
    client_secret: env.clientSecret,
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri(provider),
  });
  const response = await fetch(definition.tokenUrl, {
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
    throw new Error(`${provider} のトークン交換に失敗しました: ${detail}`);
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

const chatgptIdentity = (tokens: TokenSet): ProviderIdentity => {
  const claims = tokens.idToken ? decodeJwtPayload(tokens.idToken) : undefined;
  const authClaim = asRecord(claims?.["https://api.openai.com/auth"]);
  const plan =
    asString(authClaim.chatgpt_plan_type) ??
    asString(claims?.chatgpt_plan_type);
  const subject = asString(claims?.sub) ?? "chatgpt";
  const email = asString(claims?.email);
  const name = asString(claims?.name);
  const freePlan = plan === "free" || plan === "go";
  const connectionAccountId =
    chatgptAccountIdFromClaims(claims) ??
    chatgptAccountIdFromToken(tokens.accessToken);
  return {
    accountKey: `chatgpt:${subject}`,
    connectionAccountId,
    email,
    identity: email ?? name ?? subject,
    name,
    planWarning: freePlan
      ? "Cloud Environments には Plus 以上が必要です"
      : undefined,
  };
};

const githubIdentity = async (tokens: TokenSet): Promise<ProviderIdentity> => {
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${tokens.accessToken}`,
      "User-Agent": "adhd-stack",
    },
  });
  if (!userResponse.ok) {
    throw new Error("GitHub のユーザー情報を取得できませんでした");
  }
  const user = (await userResponse.json()) as Record<string, unknown>;
  const login = asString(user.login);
  const email = asString(user.email);
  const { id } = user;
  return {
    accountKey: `github:${String(id ?? login ?? "unknown")}`,
    email,
    identity: login ? `@${login}` : (email ?? "GitHub"),
    name: asString(user.name) ?? login,
  };
};

const cloudflareIdentity = async (
  tokens: TokenSet
): Promise<ProviderIdentity> => {
  const response = await fetch("https://dash.cloudflare.com/oauth2/userinfo", {
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error("Cloudflare のユーザー情報を取得できませんでした");
  }
  const profile = (await response.json()) as Record<string, unknown>;
  const email = asString(profile.email);
  const subject = asString(profile.sub) ?? email ?? "cloudflare";
  const hinted =
    asString(profile.account_id) ??
    asString(asRecord(asList(profile.accounts)[0]).id);
  return {
    accountKey: `cloudflare:${subject}`,
    connectionAccountId: looksLikeCfAccountId(hinted) ? hinted : undefined,
    email,
    identity: email ?? subject,
    name: asString(profile.name),
  };
};

const convexIdentity = (tokens: TokenSet): ProviderIdentity => {
  const team = tokens.accessToken.split("|")[0] ?? "convex";
  return {
    accountKey: `convex:${team}`,
    identity: team,
    name: team,
  };
};

export const loadProviderIdentity = async (
  provider: ProviderId,
  tokens: TokenSet
): Promise<ProviderIdentity> => {
  switch (provider) {
    case "chatgpt": {
      return chatgptIdentity(tokens);
    }
    case "cloudflare": {
      return await cloudflareIdentity(tokens);
    }
    case "convex": {
      return convexIdentity(tokens);
    }
    case "github": {
      return await githubIdentity(tokens);
    }
    default: {
      throw new Error("Unknown provider");
    }
  }
};
