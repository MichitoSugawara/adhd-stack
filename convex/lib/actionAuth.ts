import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import type { ProviderId } from "./providers";
import { refreshConnectionTokens } from "./tokenRefresh";
import type { StoredConnectionSecret } from "./tokenRefresh";

export const loadFreshConnection = async (
  ctx: ActionCtx,
  userId: Id<"users">,
  provider: ProviderId
): Promise<StoredConnectionSecret | null> => {
  const secret = await ctx.runQuery(
    internal.workspaceInternal.getConnectionSecret,
    { provider, userId }
  );
  if (!secret) {
    return null;
  }
  const refreshed = await refreshConnectionTokens(provider, secret);
  if (!refreshed) {
    return secret;
  }
  await ctx.runMutation(internal.workspaceInternal.saveConnectionTokens, {
    accessToken: refreshed.accessToken,
    expiresAt: refreshed.expiresAt,
    provider,
    refreshToken: refreshed.refreshToken,
    userId,
  });
  return {
    ...secret,
    accessToken: refreshed.accessToken,
    expiresAt: refreshed.expiresAt,
    refreshToken: refreshed.refreshToken,
  };
};
