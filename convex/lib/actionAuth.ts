import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import type { ProviderId } from "./providers";
import { resolveConnectionTokens } from "./tokenRefresh";
import type { StoredConnectionSecret } from "./tokenRefresh";

export type ConnectorOrToken =
  | { accountHints: string[]; connectionName: string; mode: "connector" }
  | { mode: "token"; token: string };

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
  const resolution = await resolveConnectionTokens(provider, secret);
  if (resolution.status === "current") {
    return secret;
  }
  if (resolution.status === "expired") {
    await ctx.runMutation(internal.workspaceInternal.expireConnection, {
      provider,
      userId,
    });
    return null;
  }
  await ctx.runMutation(internal.workspaceInternal.saveConnectionTokens, {
    accessToken: resolution.tokens.accessToken,
    expiresAt: resolution.tokens.expiresAt,
    provider,
    refreshToken: resolution.tokens.refreshToken,
    userId,
  });
  return {
    ...secret,
    accessToken: resolution.tokens.accessToken,
    expiresAt: resolution.tokens.expiresAt,
    refreshToken: resolution.tokens.refreshToken,
  };
};

export const loadConnectorOrToken = async (
  ctx: ActionCtx,
  userId: Id<"users">,
  provider: ProviderId
): Promise<ConnectorOrToken | null> => {
  const token = await loadFreshConnection(ctx, userId, provider);
  if (token) {
    return { mode: "token", token: token.accessToken };
  }
  const connector = await ctx.runQuery(
    internal.oauthStore.getConnectorConnection,
    { provider, userId }
  );
  if (connector?.status === "connected" && connector.connectionName) {
    return {
      accountHints: [
        connector.connectedAccountId,
        connector.displayLabel,
      ].filter((value) => value.length > 0),
      connectionName: connector.connectionName,
      mode: "connector",
    };
  }
  return null;
};
