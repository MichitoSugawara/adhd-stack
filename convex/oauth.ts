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
import { createPkce, randomUrlSafe } from "./lib/pkce";
import {
  getProviderDefinition,
  isProviderConfigured,
  PROVIDER_LABELS,
  redirectUri,
  requireProviderEnv,
} from "./lib/providers";
import { providerValidator } from "./validators";

export const beginConnect = action({
  args: { provider: providerValidator },
  handler: async (ctx, args) => {
    if (args.provider === "chatgpt") {
      throw new Error("ChatGPT はデバイスログインです");
    }
    if (!isProviderConfigured(args.provider)) {
      throw new Error(
        `${PROVIDER_LABELS[args.provider]} の OAuth アプリが未設定です。README の手順で Client ID / Secret を入れてください`
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
    return url.toString();
  },
  returns: v.string(),
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
      return { status: "authorized" as const };
    }
    const ticket = randomUrlSafe(32);
    await ctx.runMutation(internal.oauthStore.createTicket, {
      accountKey: identity.accountKey,
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
