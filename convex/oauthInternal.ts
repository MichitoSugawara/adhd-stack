import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import { providerValidator } from "./validators";

const ticketDocValidator = v.object({
  accountKey: v.string(),
  email: v.optional(v.string()),
  identity: v.string(),
  name: v.optional(v.string()),
  pendingProvider: providerValidator,
  planWarning: v.optional(v.string()),
  tokens: v.object({
    accessToken: v.string(),
    expiresAt: v.optional(v.number()),
    refreshToken: v.optional(v.string()),
  }),
});

export const getTicket = internalQuery({
  args: {
    now: v.number(),
    ticket: v.string(),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("oauthTickets")
      .withIndex("by_ticket", (q) => q.eq("ticket", args.ticket))
      .unique();
    if (!row || row.consumed || row.expiresAt <= args.now) {
      return null;
    }
    return {
      accountKey: row.accountKey,
      email: row.email,
      identity: row.identity,
      name: row.name,
      pendingProvider: row.pendingProvider,
      planWarning: row.planWarning,
      tokens: row.tokens,
    };
  },
  returns: v.union(ticketDocValidator, v.null()),
});

export const finalizeTicket = internalMutation({
  args: {
    ticket: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("oauthTickets")
      .withIndex("by_ticket", (q) => q.eq("ticket", args.ticket))
      .unique();
    if (!row || row.consumed) {
      throw new Error("Sign-in ticket is invalid");
    }
    await ctx.db.patch(row._id, { consumed: true });
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", row.pendingProvider)
      )
      .unique();
    const payload = {
      accessToken: row.tokens.accessToken,
      accountId: row.accountKey,
      connectedAt: Date.now(),
      expiresAt: row.tokens.expiresAt,
      identity: row.identity,
      planWarning: row.planWarning,
      provider: row.pendingProvider,
      refreshToken: row.tokens.refreshToken,
      status: "connected" as const,
      userId: args.userId,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return;
    }
    await ctx.db.insert("connections", payload);
  },
  returns: v.null(),
});
