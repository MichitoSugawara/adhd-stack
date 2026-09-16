import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import type { PagesRefreshResult, PublishResult } from "./lib/publishResult";
import { pagesRefreshValidator, publishResultValidator } from "./validators";

export const publish = action({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<PublishResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const workspaceId = await ctx.runQuery(
      internal.workspaceInternal.getIdBySlug,
      {
        slug: args.slug,
        userId,
      }
    );
    if (!workspaceId) {
      throw new Error("アプリが見つかりません");
    }
    return await ctx.runAction(internal.publishActions.publishWorkspace, {
      userId,
      workspaceId,
    });
  },
  returns: publishResultValidator,
});

export const refreshPages = action({
  args: { slug: v.string() },
  handler: async (ctx, args): Promise<PagesRefreshResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const workspaceId = await ctx.runQuery(
      internal.workspaceInternal.getIdBySlug,
      {
        slug: args.slug,
        userId,
      }
    );
    if (!workspaceId) {
      throw new Error("アプリが見つかりません");
    }
    return await ctx.runAction(internal.publishActions.refreshPagesDeploy, {
      userId,
      workspaceId,
    });
  },
  returns: pagesRefreshValidator,
});
