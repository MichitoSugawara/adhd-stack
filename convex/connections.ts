import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";
import { configuredProviders, PROVIDER_IDS } from "./lib/providers";
import {
  configuredValidator,
  connectionPublicValidator,
  providerValidator,
} from "./validators";

const emptyBoard = () =>
  PROVIDER_IDS.map((provider) => ({
    identity: "アカウント未選択",
    provider,
    status: "disconnected" as const,
  }));

export const getBoard = query({
  args: {},
  handler: async (ctx) => {
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
    const rows = await ctx.db
      .query("connections")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const byProvider = new Map(rows.map((row) => [row.provider, row]));
    const connections = PROVIDER_IDS.map((provider) => {
      const row = byProvider.get(provider);
      if (!row || row.status !== "connected") {
        return {
          identity: "アカウント未選択",
          provider,
          status: "disconnected" as const,
        };
      }
      return {
        identity: row.identity,
        planWarning: row.planWarning,
        provider,
        status: "connected" as const,
      };
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

export const disconnect = mutation({
  args: { provider: providerValidator },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const row = await ctx.db
      .query("connections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", user._id).eq("provider", args.provider)
      )
      .unique();
    if (!row) {
      return null;
    }
    await ctx.db.patch(row._id, {
      accessToken: "",
      planWarning: undefined,
      refreshToken: undefined,
      status: "disconnected",
    });
    return null;
  },
  returns: v.null(),
});
