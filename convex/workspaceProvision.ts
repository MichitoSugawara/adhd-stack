import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";

export const provision = action({
  args: {},
  handler: async (ctx): Promise<Id<"workspaces">> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const workspaceId: Id<"workspaces"> = await ctx.runMutation(
      internal.workspaceInternal.ensureForUser,
      { userId }
    );
    await ctx.runAction(internal.workspaceActions.provisionWorkspace, {
      userId,
      workspaceId,
    });
    return workspaceId;
  },
  returns: v.id("workspaces"),
});
