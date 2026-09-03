import { v } from "convex/values";

import { authedMutation, authedQuery } from "./lib/customFunctions";
import { provisionStatusValidator } from "./validators";

const workspacePublicValidator = v.object({
  _id: v.id("workspaces"),
  cloudflarePagesUrl: v.optional(v.string()),
  convexUrl: v.optional(v.string()),
  githubRepoFullName: v.optional(v.string()),
  githubRepoUrl: v.optional(v.string()),
  name: v.string(),
  provisionError: v.optional(v.string()),
  provisionStatus: provisionStatusValidator,
});

export const getMine = authedQuery({
  args: {},
  handler: async (ctx) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();
    if (!workspace) {
      return null;
    }
    return {
      _id: workspace._id,
      cloudflarePagesUrl: workspace.cloudflarePagesUrl,
      convexUrl: workspace.convexUrl,
      githubRepoFullName: workspace.githubRepoFullName,
      githubRepoUrl: workspace.githubRepoUrl,
      name: workspace.name,
      provisionError: workspace.provisionError,
      provisionStatus: workspace.provisionStatus,
    };
  },
  returns: v.union(workspacePublicValidator, v.null()),
});

export const ensure = authedMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("workspaces", {
      name: "app",
      provisionStatus: "pending",
      updatedAt: Date.now(),
      userId: ctx.user._id,
    });
  },
  returns: v.id("workspaces"),
});

export const publish = authedMutation({
  args: {},
  handler: async (ctx) => {
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .unique();
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    return {
      cloudflarePagesUrl: workspace.cloudflarePagesUrl ?? null,
      convexUrl: workspace.convexUrl ?? null,
    };
  },
  returns: v.object({
    cloudflarePagesUrl: v.union(v.string(), v.null()),
    convexUrl: v.union(v.string(), v.null()),
  }),
});
