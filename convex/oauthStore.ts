import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import { rememberEmailForUser } from "./lib/accountLinking";
import {
  providerValidator,
  ticketBackendValidator,
  ticketOcValidator,
  ticketTokensValidator,
} from "./validators";

export const saveState = internalMutation({
  args: {
    codeVerifier: v.string(),
    expiresAt: v.number(),
    provider: providerValidator,
    state: v.string(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthStates", args);
    return null;
  },
  returns: v.null(),
});

export const takeState = internalMutation({
  args: {
    now: v.number(),
    provider: providerValidator,
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("oauthStates")
      .withIndex("by_state", (q) => q.eq("state", args.state))
      .unique();
    if (!row || row.provider !== args.provider || row.expiresAt <= args.now) {
      return null;
    }
    await ctx.db.delete(row._id);
    return {
      codeVerifier: row.codeVerifier,
      userId: row.userId,
    };
  },
  returns: v.union(
    v.object({
      codeVerifier: v.string(),
      userId: v.optional(v.id("users")),
    }),
    v.null()
  ),
});

export const rememberUserEmail = internalMutation({
  args: {
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await rememberEmailForUser(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const upsertConnection = internalMutation({
  args: {
    accessToken: v.string(),
    accountId: v.string(),
    expiresAt: v.optional(v.number()),
    identity: v.string(),
    planWarning: v.optional(v.string()),
    provider: providerValidator,
    refreshToken: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .unique();
    const payload = {
      accessToken: args.accessToken,
      accountId: args.accountId,
      connectedAt: Date.now(),
      expiresAt: args.expiresAt,
      identity: args.identity,
      planWarning: args.planWarning,
      provider: args.provider,
      refreshToken: args.refreshToken,
      status: "connected" as const,
      userId: args.userId,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return null;
    }
    await ctx.db.insert("connections", payload);
    return null;
  },
  returns: v.null(),
});

export const createTicket = internalMutation({
  args: {
    accountKey: v.string(),
    connectionAccountId: v.optional(v.string()),
    email: v.optional(v.string()),
    identity: v.string(),
    name: v.optional(v.string()),
    pendingProvider: providerValidator,
    planWarning: v.optional(v.string()),
    ticket: v.string(),
    tokens: ticketTokensValidator,
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthTickets", {
      ...args,
      backend: "custom",
      consumed: false,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return null;
  },
  returns: v.null(),
});

export const createOcTicket = internalMutation({
  args: {
    accountKey: v.string(),
    backend: ticketBackendValidator,
    connectionAccountId: v.optional(v.string()),
    identity: v.string(),
    oc: ticketOcValidator,
    pendingProvider: providerValidator,
    ticket: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthTickets", {
      accountKey: args.accountKey,
      backend: args.backend,
      connectionAccountId: args.connectionAccountId,
      consumed: false,
      expiresAt: Date.now() + 10 * 60 * 1000,
      identity: args.identity,
      oc: args.oc,
      pendingProvider: args.pendingProvider,
      ticket: args.ticket,
    });
    return null;
  },
  returns: v.null(),
});

export const getConnectorConnection = internalQuery({
  args: {
    provider: providerValidator,
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("connectorConnections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .unique();
    if (!row) {
      return null;
    }
    return {
      connectedAccountId: row.connectedAccountId,
      connectionName: row.connectionName,
      displayLabel: row.displayLabel,
      status: row.status,
    };
  },
  returns: v.union(
    v.object({
      connectedAccountId: v.string(),
      connectionName: v.string(),
      displayLabel: v.string(),
      status: v.union(v.literal("connected"), v.literal("disconnected")),
    }),
    v.null()
  ),
});

export const upsertConnectorConnection = internalMutation({
  args: {
    connectedAccountId: v.string(),
    connectionName: v.string(),
    displayLabel: v.string(),
    provider: providerValidator,
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("connectorConnections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .unique();
    const payload = {
      backend: "openconnector" as const,
      connectedAccountId: args.connectedAccountId,
      connectedAt: Date.now(),
      connectionName: args.connectionName,
      displayLabel: args.displayLabel,
      lastCheckedAt: Date.now(),
      provider: args.provider,
      status: "connected" as const,
      userId: args.userId,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return null;
    }
    await ctx.db.insert("connectorConnections", payload);
    return null;
  },
  returns: v.null(),
});

export const clearConnectorConnection = internalMutation({
  args: {
    provider: providerValidator,
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("connectorConnections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .unique();
    if (!row) {
      return null;
    }
    await ctx.db.patch(row._id, {
      status: "disconnected",
    });
    return null;
  },
  returns: v.null(),
});

export const clearCustomConnection = internalMutation({
  args: {
    provider: providerValidator,
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("connections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
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
