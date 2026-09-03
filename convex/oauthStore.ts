import { v } from "convex/values";

import { internalMutation } from "./_generated/server";
import { rememberEmailForUser } from "./lib/accountLinking";
import { providerValidator } from "./validators";

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
    tokens: v.object({
      accessToken: v.string(),
      expiresAt: v.optional(v.number()),
      refreshToken: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("oauthTickets", {
      ...args,
      consumed: false,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return null;
  },
  returns: v.null(),
});
