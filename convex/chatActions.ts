"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

export const runCodexTurn = internalAction({
  args: {
    createdAt: v.number(),
    prompt: v.string(),
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    await ctx.runAction(internal.codingTurns.runTurn, args);
    return null;
  },
  returns: v.null(),
});
