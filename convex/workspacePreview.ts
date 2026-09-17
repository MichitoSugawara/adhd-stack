import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Infer } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation, internalQuery } from "./_generated/server";
import { slugFromName } from "./lib/appSlug";
import { authedQuery } from "./lib/customFunctions";
import { asStoredHttpUrl } from "./lib/publishResult";
import {
  previewRenderStatusValidator,
  previewRenderValidator,
  previewViewportValidator,
} from "./validators";

type PreviewRender = Infer<typeof previewRenderValidator>;

const renderRowValidator = v.object({
  error: v.optional(v.string()),
  imageStorageId: v.optional(v.id("_storage")),
  status: previewRenderStatusValidator,
  targetUrl: v.string(),
  viewport: previewViewportValidator,
});

export const getRenderRow = internalQuery({
  args: {
    targetUrl: v.string(),
    viewport: previewViewportValidator,
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("previewRenders")
      .withIndex("by_workspace_target_viewport", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("targetUrl", args.targetUrl)
          .eq("viewport", args.viewport)
      )
      .unique();
    if (!row) {
      return null;
    }
    return {
      error: row.error,
      imageStorageId: row.imageStorageId,
      status: row.status,
      targetUrl: row.targetUrl,
      viewport: row.viewport,
    };
  },
  returns: v.union(renderRowValidator, v.null()),
});

export const saveRender = internalMutation({
  args: {
    error: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    status: previewRenderStatusValidator,
    targetUrl: v.string(),
    viewport: previewViewportValidator,
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("previewRenders")
      .withIndex("by_workspace_target_viewport", (q) =>
        q
          .eq("workspaceId", args.workspaceId)
          .eq("targetUrl", args.targetUrl)
          .eq("viewport", args.viewport)
      )
      .unique();
    const previousImage = existing?.imageStorageId;
    const nextImage = args.imageStorageId ?? previousImage;
    if (
      previousImage &&
      args.imageStorageId &&
      previousImage !== args.imageStorageId
    ) {
      await ctx.storage.delete(previousImage);
    }
    const fields = {
      browser: "kitesurf" as const,
      capturedAt: Date.now(),
      error: args.error,
      imageStorageId: nextImage,
      status: args.status,
      targetUrl: args.targetUrl,
      viewport: args.viewport,
      workspaceId: args.workspaceId,
    };
    await (existing
      ? ctx.db.patch(existing._id, fields)
      : ctx.db.insert("previewRenders", fields));
    return null;
  },
  returns: v.null(),
});

export const getRender = authedQuery({
  args: {
    slug: v.string(),
    targetUrl: v.string(),
    viewport: previewViewportValidator,
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
      return null;
    }
    const normalized = asStoredHttpUrl(args.targetUrl);
    if (!normalized) {
      return null;
    }
    const row = await ctx.db
      .query("previewRenders")
      .withIndex("by_workspace_target_viewport", (q) =>
        q
          .eq("workspaceId", workspace._id)
          .eq("targetUrl", normalized)
          .eq("viewport", args.viewport)
      )
      .unique();
    if (!row) {
      return null;
    }
    const imageUrl = row.imageStorageId
      ? await ctx.storage.getUrl(row.imageStorageId)
      : null;
    return {
      browser: "kitesurf" as const,
      capturedAt: row.capturedAt,
      imageUrl,
      message: row.error ?? "",
      status: row.status,
      targetUrl: row.targetUrl,
      viewport: row.viewport,
    };
  },
  returns: v.union(previewRenderValidator, v.null()),
});

export const captureWithKitesurf = action({
  args: {
    force: v.optional(v.boolean()),
    slug: v.string(),
    targetUrl: v.string(),
    viewport: previewViewportValidator,
  },
  handler: async (ctx, args): Promise<PreviewRender> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const workspaceId: Id<"workspaces"> | null = await ctx.runQuery(
      internal.workspaceInternal.getIdBySlug,
      { slug: args.slug, userId }
    );
    if (!workspaceId) {
      throw new Error("アプリが見つかりません");
    }
    const result: PreviewRender = await ctx.runAction(
      internal.browserRunActions.capturePreview,
      {
        force: args.force ?? false,
        targetUrl: args.targetUrl,
        userId,
        viewport: args.viewport,
        workspaceId,
      }
    );
    return result;
  },
  returns: previewRenderValidator,
});

export const renderImageUrl = internalQuery({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args): Promise<string | null> =>
    await ctx.storage.getUrl(args.storageId),
  returns: v.union(v.string(), v.null()),
});
