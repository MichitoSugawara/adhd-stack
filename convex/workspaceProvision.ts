import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import { nextUniqueSlug, slugFromName } from "./lib/appSlug";
import { userHasAllConnections } from "./lib/connectionReady";
import { authedMutation } from "./lib/customFunctions";

const createdValidator = v.object({
  slug: v.string(),
  workspaceId: v.id("workspaces"),
});

export const createAndProvision = authedMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length === 0) {
      throw new Error("名前を入力してください");
    }
    if (name.length > 80) {
      throw new Error("名前は 80 文字までです");
    }
    const ready = await userHasAllConnections(ctx, ctx.user._id, Date.now());
    if (!ready) {
      throw new Error("接続が揃うまで作成できません");
    }
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", ctx.user._id))
      .take(50);
    const slug = nextUniqueSlug(
      slugFromName(name),
      new Set(rows.map((row) => row.slug ?? slugFromName(row.name)))
    );
    const workspaceId = await ctx.db.insert("workspaces", {
      codingBackend: "codex_cloud",
      name,
      provisionStatus: "pending",
      provisionSteps: {
        backend: "pending",
        convex: "pending",
        pages: "pending",
        repo: "pending",
        template: "pending",
      },
      slug,
      updatedAt: Date.now(),
      userId: ctx.user._id,
    });
    await ctx.scheduler.runAfter(0, internal.workspaceActions.provisionWorkspace, {
      force: true,
      userId: ctx.user._id,
      workspaceId,
    });
    return { slug, workspaceId };
  },
  returns: createdValidator,
});

export const retryProvision = authedMutation({
  args: { slug: v.string() },
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
    await ctx.scheduler.runAfter(0, internal.workspaceActions.provisionWorkspace, {
      force: true,
      userId: ctx.user._id,
      workspaceId: workspace._id,
    });
    return { slug: workspace.slug ?? slugFromName(workspace.name), workspaceId: workspace._id };
  },
  returns: createdValidator,
});

export const provision = action({
  args: {
    force: v.optional(v.boolean()),
    slug: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"workspaces">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const workspaceId: Id<"workspaces"> | null = args.slug
      ? await ctx.runQuery(internal.workspaceInternal.getIdBySlug, {
          slug: args.slug,
          userId,
        })
      : ((
          await ctx.runQuery(internal.workspaceInternal.listIdsForUser, {
            userId,
          })
        )[0] ?? null);
    if (!workspaceId) {
      throw new Error("アプリを先に作ってください");
    }
    await ctx.runAction(internal.workspaceActions.provisionWorkspace, {
      force: args.force,
      userId,
      workspaceId,
    });
    return workspaceId;
  },
  returns: v.id("workspaces"),
});
