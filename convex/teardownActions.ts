"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { loadConnectorOrToken, loadFreshConnection } from "./lib/actionAuth";
import { runCascadeDelete } from "./lib/cascadeDelete";
import type { CascadeWorkspaceSnapshot } from "./lib/cascadeDeletePlan";
import type { CascadeDeleteResult } from "./lib/cascadeDeleteResult";
import { cascadeDeleteResultValidator } from "./validators";

interface TeardownWorkspace extends CascadeWorkspaceSnapshot {
  name: string;
  slug: string;
  userId: Id<"users">;
}

export const cascadeDeleteWorkspace = internalAction({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<CascadeDeleteResult> => {
    const workspace = (await ctx.runQuery(
      internal.workspaceInternal.getWorkspaceForTeardown,
      { workspaceId: args.workspaceId }
    )) as TeardownWorkspace | null;
    if (!workspace || workspace.userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    return await runCascadeDelete(workspace, {
      deleteLocal: async (): Promise<boolean> => {
        let deleted = false;
        let done = false;
        while (!done) {
          const batch = (await ctx.runMutation(
            internal.workspaceInternal.deleteWorkspaceLocalBatch,
            {
              userId: args.userId,
              workspaceId: args.workspaceId,
            }
          )) as { deleted: boolean; done: boolean };
          const { deleted: batchDeleted, done: batchDone } = batch;
          deleted ||= batchDeleted;
          done = batchDone;
        }
        return deleted;
      },
      loadChatgpt: () => loadFreshConnection(ctx, args.userId, "chatgpt"),
      loadCloudflare: () => loadFreshConnection(ctx, args.userId, "cloudflare"),
      loadConvex: () => loadConnectorOrToken(ctx, args.userId, "convex"),
      loadGithub: () => loadConnectorOrToken(ctx, args.userId, "github"),
    });
  },
  returns: cascadeDeleteResultValidator,
});
