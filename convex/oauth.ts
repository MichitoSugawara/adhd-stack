import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import {
  CODEX_DEVICE_TIMEOUT_MS,
  exchangeCodexDeviceCode,
  identityFromCodexTokens,
  pollCodexDeviceOnce,
  requestCodexUserCode,
} from "./lib/codexDevice";
import {
  ensureGithubOauthScopes,
  GITHUB_OAUTH_SCOPES,
} from "./lib/githubOauthScopes";
import {
  assertOauthAppReady,
  findNamedOcConnection,
  isOpenConnectorService,
  makeConnectionName,
  startOauthAuthorization,
} from "./lib/openConnector";
import { isOpenConnectorConfigured } from "./lib/openConnectorEnv";
import { createPkce, randomUrlSafe } from "./lib/pkce";
import {
  getProviderDefinition,
  isProviderConfigured,
  PROVIDER_LABELS,
  redirectUri,
  requireProviderEnv,
  siteUrl,
} from "./lib/providers";
import { providerValidator } from "./validators";

const beginUrlValidator = v.object({
  connectionName: v.optional(v.string()),
  kind: v.union(v.literal("oauth"), v.literal("catalog")),
  url: v.string(),
});

// 接続ボードは `/connect`（`apps/web/app/connect/page.tsx`）。`/` は入口だけ。
const ocReturnUri = (service: "github" | "convex", connectionName: string) => {
  try {
    const base = siteUrl();
    return `${base}/connect?oc=${service}&name=${encodeURIComponent(connectionName)}`;
  } catch {
    return "";
  }
};

export const beginConnect = action({
  args: { provider: providerValidator },
  handler: async (ctx, args) => {
    if (args.provider === "chatgpt") {
      throw new Error("ChatGPT はデバイスログインです");
    }
    if (isOpenConnectorService(args.provider)) {
      if (!isOpenConnectorConfigured()) {
        throw new Error(
          `oauth_not_configured: ${PROVIDER_LABELS[args.provider]} の接続アプリが未設定です`
        );
      }
      await assertOauthAppReady(args.provider);
      const userId = await getAuthUserId(ctx);
      const connectionName = makeConnectionName(
        args.provider,
        userId ?? "pending"
      );
      const returnUri = ocReturnUri(args.provider, connectionName);
      const requestedScopes =
        args.provider === "github" ? GITHUB_OAUTH_SCOPES : undefined;
      const started =
        returnUri.length > 0
          ? await startOauthAuthorization({
              connectionName,
              requestedScopes,
              returnUri,
              service: args.provider,
            })
          : await startOauthAuthorization({
              connectionName,
              requestedScopes,
              service: args.provider,
            });
      const url =
        args.provider === "github"
          ? ensureGithubOauthScopes(started.authorizationUrl)
          : started.authorizationUrl;
      return {
        connectionName,
        kind: "catalog" as const,
        url,
      };
    }
    if (!isProviderConfigured(args.provider)) {
      throw new Error(
        `oauth_not_configured: ${PROVIDER_LABELS[args.provider]} の接続アプリが未設定です`
      );
    }
    const userId = await getAuthUserId(ctx);
    const env = requireProviderEnv(args.provider);
    const definition = getProviderDefinition(args.provider);
    const pkce = await createPkce();
    const state = randomUrlSafe(24);
    await ctx.runMutation(internal.oauthStore.saveState, {
      codeVerifier: pkce.verifier,
      expiresAt: Date.now() + 10 * 60 * 1000,
      provider: args.provider,
      state,
      userId: userId ?? undefined,
    });
    const url = new URL(definition.authorizationUrl);
    url.searchParams.set("client_id", env.clientId);
    url.searchParams.set("redirect_uri", redirectUri(args.provider));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", pkce.challenge);
    url.searchParams.set("code_challenge_method", "S256");
    if (definition.scopes.length > 0) {
      url.searchParams.set("scope", definition.scopes.join(" "));
    }
    if (definition.extraAuthorizationParams) {
      for (const [key, value] of Object.entries(
        definition.extraAuthorizationParams
      )) {
        url.searchParams.set(key, value);
      }
    }
    return {
      kind: "oauth" as const,
      url: url.toString(),
    };
  },
  returns: beginUrlValidator,
});

export const confirmOcConnect = action({
  args: {
    connectionName: v.string(),
    service: v.union(v.literal("convex"), v.literal("github")),
  },
  handler: async (ctx, args) => {
    if (!isOpenConnectorConfigured()) {
      throw new Error(
        `oauth_not_configured: ${PROVIDER_LABELS[args.service]} の接続アプリが未設定です`
      );
    }
    const found = await findNamedOcConnection(
      args.service,
      args.connectionName
    );
    if (!found) {
      return { status: "pending" as const };
    }
    const identity = found.displayName;
    const userId = await getAuthUserId(ctx);
    if (userId) {
      await ctx.runMutation(internal.oauthStore.upsertConnectorConnection, {
        connectedAccountId: found.id,
        connectionName: args.connectionName,
        displayLabel: identity,
        provider: args.service,
        userId,
      });
      return { identity, status: "connected" as const };
    }
    const ticket = randomUrlSafe(32);
    await ctx.runMutation(internal.oauthStore.createOcTicket, {
      accountKey: `oc:${args.service}:${found.id}`,
      backend: "openconnector",
      connectionAccountId: found.id,
      identity,
      oc: {
        connectedAccountId: found.id,
        connectionName: args.connectionName,
        displayLabel: identity,
        service: args.service,
      },
      pendingProvider: args.service,
      ticket,
    });
    return { identity, status: "authorized" as const, ticket };
  },
  returns: v.union(
    v.object({ status: v.literal("pending") }),
    v.object({
      identity: v.string(),
      status: v.literal("connected"),
    }),
    v.object({
      identity: v.string(),
      status: v.literal("authorized"),
      ticket: v.string(),
    })
  ),
});

export const beginChatgptDevice = action({
  args: {},
  handler: async () => await requestCodexUserCode(),
  returns: v.object({
    deviceAuthId: v.string(),
    intervalSeconds: v.number(),
    userCode: v.string(),
    verificationUrl: v.string(),
    verificationUrlFallback: v.string(),
  }),
});

export const pollChatgptDevice = action({
  args: {
    deviceAuthId: v.string(),
    startedAt: v.number(),
    userCode: v.string(),
  },
  handler: async (ctx, args) => {
    if (Date.now() - args.startedAt > CODEX_DEVICE_TIMEOUT_MS) {
      throw new Error(
        "ChatGPT のデバイスコードが期限切れです。もう一度接続してください"
      );
    }
    const [userId, codes] = await Promise.all([
      getAuthUserId(ctx),
      pollCodexDeviceOnce(args.deviceAuthId, args.userCode),
    ]);
    if (codes === "pending") {
      return { status: "pending" as const };
    }
    const tokens = await exchangeCodexDeviceCode(
      codes.authorizationCode,
      codes.codeVerifier
    );
    const identity = await identityFromCodexTokens(tokens);
    if (userId) {
      await ctx.runMutation(internal.oauthStore.upsertConnection, {
        accessToken: tokens.accessToken,
        accountId: identity.connectionAccountId ?? identity.accountKey,
        expiresAt: tokens.expiresAt,
        identity: identity.identity,
        planWarning: identity.planWarning,
        provider: "chatgpt",
        refreshToken: tokens.refreshToken,
        userId,
      });
      await ctx.runMutation(internal.oauthStore.rememberUserEmail, {
        email: identity.email,
        name: identity.name,
        userId,
      });
      return { status: "authorized" as const };
    }
    const ticket = randomUrlSafe(32);
    await ctx.runMutation(internal.oauthStore.createTicket, {
      accountKey: identity.accountKey,
      connectionAccountId: identity.connectionAccountId,
      email: identity.email,
      identity: identity.identity,
      name: identity.name,
      pendingProvider: "chatgpt",
      planWarning: identity.planWarning,
      ticket,
      tokens: {
        accessToken: tokens.accessToken,
        expiresAt: tokens.expiresAt,
        refreshToken: tokens.refreshToken,
      },
    });
    return { status: "authorized" as const, ticket };
  },
  returns: v.union(
    v.object({ status: v.literal("pending") }),
    v.object({
      status: v.literal("authorized"),
      ticket: v.optional(v.string()),
    })
  ),
});
