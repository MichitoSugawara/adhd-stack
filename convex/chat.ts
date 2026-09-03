import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";

import { internal } from "./_generated/api";
import { authedMutation, authedQuery } from "./lib/customFunctions";
import { messageKindValidator, messageRoleValidator } from "./validators";

const messageValidator = v.object({
  _creationTime: v.number(),
  _id: v.id("messages"),
  body: v.string(),
  createdAt: v.number(),
  externalId: v.optional(v.string()),
  kind: messageKindValidator,
  meta: v.optional(
    v.object({
      additions: v.optional(v.number()),
      command: v.optional(v.string()),
      deletions: v.optional(v.number()),
      files: v.optional(v.array(v.string())),
    })
  ),
  role: messageRoleValidator,
  workspaceId: v.id("workspaces"),
});

export const list = authedQuery({
  args: {
    paginationOpts: paginationOptsValidator,
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.userId !== ctx.user._id) {
      throw new Error("Unauthorized");
    }
    return await ctx.db
      .query("messages")
      .withIndex("by_workspace_and_created", (q) =>
        q.eq("workspaceId", args.workspaceId)
      )
      .order("asc")
      .paginate(args.paginationOpts);
  },
  returns: v.object({
    continueCursor: v.string(),
    isDone: v.boolean(),
    page: v.array(messageValidator),
    pageStatus: v.optional(v.union(v.null(), v.string())),
    splitCursor: v.optional(v.union(v.null(), v.string())),
  }),
});

export const send = authedMutation({
  args: {
    text: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace || workspace.userId !== ctx.user._id) {
      throw new Error("Unauthorized");
    }
    const text = args.text.trim();
    if (text.length === 0) {
      throw new Error("Message is empty");
    }
    if (!(workspace.githubRepoUrl && workspace.codexEnvironmentId)) {
      throw new Error(
        "リポジトリと Codex Cloud 環境の準備が終わるまで送れません"
      );
    }
    const createdAt = Date.now();
    await ctx.db.insert("messages", {
      body: text,
      createdAt,
      kind: "text",
      role: "user",
      workspaceId: args.workspaceId,
    });
    await ctx.scheduler.runAfter(0, internal.chatActions.runCodexTurn, {
      createdAt,
      prompt: text,
      userId: ctx.user._id,
      workspaceId: args.workspaceId,
    });
    return null;
  },
  returns: v.null(),
});
