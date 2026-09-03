import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action } from "./_generated/server";
import type { PublishResult } from "./lib/publishResult";

export const publish = action({
  args: {},
  handler: async (ctx): Promise<PublishResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    const workspaceId: Id<"workspaces"> = await ctx.runMutation(
      internal.workspaceInternal.ensureForUser,
      { userId }
    );
    return await ctx.runAction(internal.publishActions.publishWorkspace, {
      userId,
      workspaceId,
    });
  },
  returns: v.object({
    cloudflarePagesUrl: v.union(v.string(), v.null()),
    convexUrl: v.union(v.string(), v.null()),
    error: v.union(v.string(), v.null()),
  }),
});
