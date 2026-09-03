import { httpRouter } from "convex/server";

import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import {
  exchangeAuthorizationCode,
  loadProviderIdentity,
} from "./lib/oauthExchange";
import { randomUrlSafe } from "./lib/pkce";
import { PROVIDER_IDS, siteUrl } from "./lib/providers";
import type { ProviderId } from "./lib/providers";

const isProviderId = (value: string): value is ProviderId =>
  PROVIDER_IDS.some((id) => id === value);

const redirectWith = (path: string): Response => {
  const target = new URL(path, `${siteUrl()}/`);
  return new Response(null, {
    headers: { Location: target.toString() },
    status: 302,
  });
};

const handleCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const provider = url.pathname.split("/").at(-1) ?? "";
  if (!isProviderId(provider)) {
    return redirectWith("/?oauth_error=unknown_provider");
  }
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return redirectWith(`/?oauth_error=${encodeURIComponent(oauthError)}`);
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!(code && state)) {
    return redirectWith("/?oauth_error=missing_code");
  }
  const stored = await ctx.runMutation(internal.oauthStore.takeState, {
    now: Date.now(),
    provider,
    state,
  });
  if (!stored) {
    return redirectWith("/?oauth_error=invalid_state");
  }
  try {
    const tokens = await exchangeAuthorizationCode(
      provider,
      code,
      stored.codeVerifier
    );
    const identity = await loadProviderIdentity(provider, tokens);
    if (stored.userId) {
      await ctx.runMutation(internal.oauthStore.upsertConnection, {
        accessToken: tokens.accessToken,
        accountId: identity.connectionAccountId ?? identity.accountKey,
        expiresAt: tokens.expiresAt,
        identity: identity.identity,
        planWarning: identity.planWarning,
        provider,
        refreshToken: tokens.refreshToken,
        userId: stored.userId,
      });
      return redirectWith(`/?connected=${provider}`);
    }
    const ticket = randomUrlSafe(32);
    await ctx.runMutation(internal.oauthStore.createTicket, {
      accountKey: identity.accountKey,
      email: identity.email,
      identity: identity.identity,
      name: identity.name,
      pendingProvider: provider,
      planWarning: identity.planWarning,
      ticket,
      tokens: {
        accessToken: tokens.accessToken,
        expiresAt: tokens.expiresAt,
        refreshToken: tokens.refreshToken,
      },
    });
    return redirectWith(`/?ticket=${encodeURIComponent(ticket)}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "oauth_exchange_failed";
    return redirectWith(`/?oauth_error=${encodeURIComponent(message)}`);
  }
});

const http = httpRouter();
auth.addHttpRoutes(http);

for (const provider of PROVIDER_IDS) {
  if (provider === "chatgpt") {
    continue;
  }
  http.route({
    handler: handleCallback,
    method: "GET",
    path: `/oauth/callback/${provider}`,
  });
}

export default http;
