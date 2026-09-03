import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
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
