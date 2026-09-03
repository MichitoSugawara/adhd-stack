import type { Infer } from "convex/values";

import type { providerValidator } from "../validators";

export type ProviderId = Infer<typeof providerValidator>;

export const PROVIDER_IDS = [
  "chatgpt",
  "github",
  "cloudflare",
  "convex",
] as const satisfies readonly ProviderId[];

export const PROVIDER_LABELS = {
  chatgpt: "ChatGPT",
  cloudflare: "Cloudflare",
  convex: "Convex",
  github: "GitHub",
} as const satisfies Record<ProviderId, string>;

interface ProviderEnv {
  clientId: string | undefined;
  clientSecret: string | undefined;
}

interface ProviderDefinition {
  authorizationUrl: string;
  extraAuthorizationParams?: Record<string, string>;
  scopes: string[];
  tokenUrl: string;
}

const DEFINITIONS = {
  chatgpt: {
    authorizationUrl: "https://auth.openai.com/oauth/authorize",
    extraAuthorizationParams: {
      id_token_add_organizations: "true",
    },
    scopes: ["email", "offline_access", "openid", "profile"],
    tokenUrl: "https://auth.openai.com/oauth/token",
  },
  cloudflare: {
    authorizationUrl: "https://dash.cloudflare.com/oauth2/auth",
    scopes: [
      "user-details.read",
      "account-settings.read",
      "page.read",
      "page.write",
      "workers-scripts.read",
      "workers-scripts.write",
    ],
    tokenUrl: "https://dash.cloudflare.com/oauth2/token",
  },
  convex: {
    authorizationUrl: "https://dashboard.convex.dev/oauth/authorize/team",
    scopes: [],
    tokenUrl: "https://api.convex.dev/oauth/token",
  },
  github: {
    authorizationUrl: "https://github.com/login/oauth/authorize",
    scopes: ["read:user", "repo", "user:email"],
    tokenUrl: "https://github.com/login/oauth/access_token",
  },
} as const satisfies Record<ProviderId, ProviderDefinition>;

const ENV_KEYS = {
  chatgpt: {
    id: "CHATGPT_CLIENT_ID",
    secret: "CHATGPT_CLIENT_SECRET",
  },
  cloudflare: {
    id: "CLOUDFLARE_CLIENT_ID",
    secret: "CLOUDFLARE_CLIENT_SECRET",
  },
  convex: {
    id: "CONVEX_OAUTH_CLIENT_ID",
    secret: "CONVEX_OAUTH_CLIENT_SECRET",
  },
  github: {
    id: "GITHUB_CLIENT_ID",
    secret: "GITHUB_CLIENT_SECRET",
  },
} as const satisfies Record<ProviderId, { id: string; secret: string }>;

export const readProviderEnv = (provider: ProviderId): ProviderEnv => {
  const keys = ENV_KEYS[provider];
  return {
    clientId: process.env[keys.id],
    clientSecret: process.env[keys.secret],
  };
};

export const isProviderConfigured = (provider: ProviderId): boolean => {
  const env = readProviderEnv(provider);
  return Boolean(env.clientId && env.clientSecret);
};

export const configuredProviders = () => ({
  chatgpt: isProviderConfigured("chatgpt"),
  cloudflare: isProviderConfigured("cloudflare"),
  convex: isProviderConfigured("convex"),
  github: isProviderConfigured("github"),
});

export const requireProviderEnv = (
  provider: ProviderId
): { clientId: string; clientSecret: string } => {
  const env = readProviderEnv(provider);
  if (!(env.clientId && env.clientSecret)) {
    throw new Error(
      `${PROVIDER_LABELS[provider]} の OAuth アプリが未設定です。README の手順で ${ENV_KEYS[provider].id} と ${ENV_KEYS[provider].secret} を Convex に入れてください`
    );
  }
  return {
    clientId: env.clientId,
    clientSecret: env.clientSecret,
  };
};

export const getProviderDefinition = (
  provider: ProviderId
): ProviderDefinition => DEFINITIONS[provider];

export const callbackPath = (provider: ProviderId): string =>
  `/oauth/callback/${provider}`;

export const siteUrl = (): string => {
  const value = process.env.SITE_URL;
  if (!value) {
    throw new Error("SITE_URL が未設定です。例: http://localhost:3000");
  }
  return value.replace(/\/$/u, "");
};

export const convexSiteUrl = (): string => {
  const value = process.env.CONVEX_SITE_URL;
  if (!value) {
    throw new Error("CONVEX_SITE_URL がありません");
  }
  return value.replace(/\/$/u, "");
};

export const redirectUri = (provider: ProviderId): string =>
  `${convexSiteUrl()}${callbackPath(provider)}`;
