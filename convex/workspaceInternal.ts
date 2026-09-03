import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import { providerValidator, provisionStatusValidator } from "./validators";

export const getWorkspace = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return null;
    }
    return {
      githubRepoUrl: workspace.githubRepoUrl,
      provisionStatus: workspace.provisionStatus,
    };
  },
  returns: v.union(
    v.object({
      githubRepoUrl: v.optional(v.string()),
      provisionStatus: provisionStatusValidator,
    }),
    v.null()
  ),
});

export const ensureForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("workspaces", {
      name: "app",
      provisionStatus: "pending",
      updatedAt: Date.now(),
      userId: args.userId,
    });
  },
  returns: v.id("workspaces"),
});

export const getConnectionSecret = internalQuery({
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
    if (!row || row.status !== "connected" || row.accessToken.length === 0) {
      return null;
    }
    return {
      accessToken: row.accessToken,
      identity: row.identity,
    };
  },
  returns: v.union(
    v.object({
      accessToken: v.string(),
      identity: v.string(),
    }),
    v.null()
  ),
});

export const patchWorkspace = internalMutation({
  args: {
    cloudflarePagesUrl: v.optional(v.string()),
    convexUrl: v.optional(v.string()),
    githubRepoFullName: v.optional(v.string()),
    githubRepoUrl: v.optional(v.string()),
    provisionError: v.optional(v.string()),
    provisionStatus: provisionStatusValidator,
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    const { workspaceId, ...updates } = args;
    await ctx.db.patch(workspaceId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return null;
  },
  returns: v.null(),
});

export const insertSystemMessage = internalMutation({
  args: {
    body: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      body: args.body,
      createdAt: Date.now(),
      kind: "text",
      role: "system",
      workspaceId: args.workspaceId,
    });
    return null;
  },
  returns: v.null(),
});
