import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action, query } from "./_generated/server";
import { getCurrentUserOrNull } from "./lib/auth";
import {
  deleteOcConnection,
  isOpenConnectorService,
} from "./lib/openConnector";
import { configuredProviders, PROVIDER_IDS } from "./lib/providers";
import type { ProviderId } from "./lib/providers";
import { canKeepConnection, reconnectMessage } from "./lib/tokenRefresh";
import {
  configuredValidator,
  connectionPublicValidator,
  providerValidator,
} from "./validators";

const disconnectedConnection = (
  provider: ProviderId,
  reconnectHint?: string
) => ({
  identity: "アカウント未選択",
  provider,
  reconnectHint,
  status: "disconnected" as const,
});

const emptyBoard = () =>
  PROVIDER_IDS.map((provider) => disconnectedConnection(provider));

export const getBoard = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const configured = configuredProviders();
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return {
        allConnected: false,
        authenticated: false,
        configured,
        connections: emptyBoard(),
      };
    }
    const [customRows, connectorRows] = await Promise.all([
      ctx.db
        .query("connections")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(8),
      ctx.db
        .query("connectorConnections")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .take(8),
    ]);
    const customByProvider = new Map(
      customRows.map((row) => [row.provider, row])
    );
    const connectorByProvider = new Map(
      connectorRows.map((row) => [row.provider, row])
    );
    const connections = PROVIDER_IDS.map((provider) => {
      if (isOpenConnectorService(provider)) {
        const row = connectorByProvider.get(provider);
        if (row?.status === "connected" && row.connectedAccountId.length > 0) {
          return {
            identity: row.displayLabel,
            provider,
            reconnectHint: undefined,
            status: "connected" as const,
          };
        }
        return disconnectedConnection(provider);
      }
      const row = customByProvider.get(provider);
      if (!row) {
        return disconnectedConnection(provider);
      }
      if (
        canKeepConnection(
          {
            accessToken: row.accessToken,
            expiresAt: row.expiresAt,
            refreshToken: row.refreshToken,
            status: row.status,
          },
          args.now
        )
      ) {
        return {
          identity: row.identity,
          planWarning: row.planWarning,
          provider,
          reconnectHint: undefined,
          status: "connected" as const,
        };
      }
      const expired =
        row.status === "connected" &&
        Boolean(row.expiresAt) &&
        !row.refreshToken;
      return disconnectedConnection(
        provider,
        expired ? reconnectMessage(provider) : undefined
      );
    });
    return {
      allConnected: connections.every((item) => item.status === "connected"),
      authenticated: true,
      configured,
      connections,
    };
  },
  returns: v.object({
    allConnected: v.boolean(),
    authenticated: v.boolean(),
    configured: configuredValidator,
    connections: v.array(connectionPublicValidator),
  }),
});

export const disconnect = action({
  args: { provider: providerValidator },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    if (isOpenConnectorService(args.provider)) {
      const row = await ctx.runQuery(
        internal.oauthStore.getConnectorConnection,
        {
          provider: args.provider,
          userId,
        }
      );
      if (row?.connectionName) {
        try {
          await deleteOcConnection(args.provider, row.connectionName);
        } catch {
          // Local row still disconnects so the board stays honest.
        }
      }
      await ctx.runMutation(internal.oauthStore.clearConnectorConnection, {
        provider: args.provider,
        userId,
      });
      return null;
    }
    await ctx.runMutation(internal.oauthStore.clearCustomConnection, {
      provider: args.provider,
      userId,
    });
    return null;
  },
  returns: v.null(),
});
