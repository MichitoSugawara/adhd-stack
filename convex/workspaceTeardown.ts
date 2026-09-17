import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { action } from "./_generated/server";
import { slugFromName } from "./lib/appSlug";
import type { CascadeDeleteResult } from "./lib/cascadeDeleteResult";
import { cascadeDeleteResultValidator } from "./validators";

const confirmMatches = (args: {
  confirmName: string;
  name: string;
  slug: string;
}): boolean => {
  const typed = args.confirmName.trim();
  return typed === args.name.trim() || typed === args.slug;
};

export const deleteApp = action({
  args: {
    confirmName: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args): Promise<CascadeDeleteResult> => {
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
    const workspace = await ctx.runQuery(
      internal.workspaceInternal.getWorkspaceForTeardown,
      { workspaceId }
    );
    if (!workspace || workspace.userId !== userId) {
      throw new Error("Unauthorized");
    }
    const slug = workspace.slug || slugFromName(workspace.name);
    if (
      !confirmMatches({
        confirmName: args.confirmName,
        name: workspace.name,
        slug,
      })
    ) {
      throw new Error(
        "名前が一致しません。削除するには、アプリの名前を入力してください"
      );
    }
    return await ctx.runAction(
      internal.teardownActions.cascadeDeleteWorkspace,
      {
        userId,
        workspaceId,
      }
    );
  },
  returns: cascadeDeleteResultValidator,
});
