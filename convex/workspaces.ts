import { v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { nextUniqueSlug, slugFromName } from "./lib/appSlug";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { codingBackendValidator, workspacePublicValidator } from "./validators";

const toPublic = (workspace: Doc<"workspaces">) => ({
  _id: workspace._id,
  cloudflarePagesUrl: workspace.cloudflarePagesUrl,
  cloudflarePreviewUrl: workspace.cloudflarePreviewUrl,
  codingBackend: workspace.codingBackend,
  codingEnvironmentId:
    workspace.codingEnvironmentId ?? workspace.codexEnvironmentId,
  convexUrl: workspace.convexUrl,
  name: workspace.name,
  pagesDeployStatus: workspace.pagesDeployStatus,
  provisionError: workspace.provisionError,
  provisionStatus: workspace.provisionStatus,
  provisionSteps: workspace.provisionSteps,
  publishError: workspace.publishError,
  publishNotes: workspace.publishNotes,
  ready: workspace.provisionStatus === "ready",
  slug: workspace.slug ?? slugFromName(workspace.name),
});

export const listMine = authedQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .take(50);
    return rows
      .toSorted((left, right) => right.updatedAt - left.updatedAt)
      .map((row) => toPublic(row));
  },
  returns: v.array(workspacePublicValidator),
});

export const getBySlug = authedQuery({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const exact = await ctx.db
      .query("workspaces")
      .withIndex("by_user_and_slug", (q) =>
        q.eq("userId", ctx.user._id).eq("slug", args.slug)
      )
      .unique();
    if (exact) {
      return toPublic(exact);
    }
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .take(50);
    const match = rows.find(
      (row) => (row.slug ?? slugFromName(row.name)) === args.slug
    );
    return match ? toPublic(match) : null;
  },
  returns: v.union(workspacePublicValidator, v.null()),
});

export const getMine = authedQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .take(1);
    return rows[0] ? toPublic(rows[0]) : null;
  },
  returns: v.union(workspacePublicValidator, v.null()),
});

export const ensure = authedMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .take(1);
    if (existing[0]) {
      return existing[0]._id;
    }
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .take(50);
    const slug = nextUniqueSlug(
      "workspace",
      new Set(rows.map((row) => row.slug ?? slugFromName(row.name)))
    );
    return await ctx.db.insert("workspaces", {
      codingBackend: "codex_cloud",
      name: "アプリ",
      provisionStatus: "pending",
      slug,
      updatedAt: Date.now(),
      userId: ctx.user._id,
    });
  },
  returns: v.id("workspaces"),
});

export const setCodingBackend = authedMutation({
  args: {
    codingBackend: codingBackendValidator,
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const exact = await ctx.db
      .query("workspaces")
      .withIndex("by_user_and_slug", (q) =>
        q.eq("userId", ctx.user._id).eq("slug", args.slug)
      )
      .unique();
    const rows = exact
      ? [exact]
      : await ctx.db
          .query("workspaces")
          .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
          .take(50);
    const workspace =
      exact ??
      rows.find((row) => (row.slug ?? slugFromName(row.name)) === args.slug);
    if (!workspace) {
      throw new Error("アプリが見つかりません");
    }
    await ctx.db.patch(workspace._id, {
      codingBackend: args.codingBackend,
      updatedAt: Date.now(),
    });
    return null;
  },
  returns: v.null(),
});
