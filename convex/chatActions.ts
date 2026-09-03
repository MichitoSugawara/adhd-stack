"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import type { ActionCtx } from "./_generated/server";
import { loadFreshConnection } from "./lib/actionAuth";
import {
  createCodexTask,
  getCodexTaskSnapshot,
  isCodexTaskDone,
  resolveCodexAccountId,
  summarizeDiff,
} from "./lib/codexCloud";
import type { CodexTaskSnapshot } from "./lib/codexCloud";

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const persistSnapshot = async (
  ctx: ActionCtx,
  workspaceId: Id<"workspaces">,
  taskId: string,
  snapshot: CodexTaskSnapshot
): Promise<void> => {
  if (snapshot.thinking.length > 0) {
    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: snapshot.thinking.join("\n"),
      externalId: `${taskId}:thinking`,
      kind: "thinking",
      role: "assistant",
      workspaceId,
    });
  }
  if (snapshot.work || snapshot.status) {
    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: snapshot.work ?? snapshot.status ?? "作業中",
      externalId: `${taskId}:work`,
      kind: "work",
      role: "assistant",
      workspaceId,
    });
  }
  for (const command of snapshot.commands) {
    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: command,
      externalId: `${taskId}:command:${command}`,
      kind: "command",
      meta: { command },
      role: "assistant",
      workspaceId,
    });
  }
  if (snapshot.diff || snapshot.files.length > 0) {
    const stats = snapshot.diff
      ? summarizeDiff(snapshot.diff)
      : { additions: 0, deletions: 0, files: snapshot.files };
    const files = stats.files.length > 0 ? stats.files : snapshot.files;
    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body:
        files.length > 0
          ? files.join("\n")
          : (snapshot.diff ?? "差分があります"),
      externalId: `${taskId}:diff`,
      kind: "diff",
      meta: {
        additions: stats.additions,
        deletions: stats.deletions,
        files,
      },
      role: "assistant",
      workspaceId,
    });
  }
  if (snapshot.texts.length > 0) {
    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: snapshot.texts.join("\n\n"),
      externalId: `${taskId}:text`,
      kind: "text",
      role: "assistant",
      workspaceId,
    });
  }
  if (snapshot.error) {
    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: snapshot.error,
      externalId: `${taskId}:error`,
      kind: "work",
      role: "assistant",
      workspaceId,
    });
  }
};

export const runCodexTurn = internalAction({
  args: {
    createdAt: v.number(),
    prompt: v.string(),
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.runQuery(
      internal.workspaceInternal.getWorkspace,
      { workspaceId: args.workspaceId }
    );
    if (!(workspace?.codexEnvironmentId && workspace.githubRepoUrl)) {
      await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
        body: "Codex Cloud 環境がまだありません",
        createdAt: args.createdAt + 1,
        externalId: `error:${args.createdAt}`,
        kind: "work",
        role: "assistant",
        workspaceId: args.workspaceId,
      });
      return null;
    }

    const chatgpt = await loadFreshConnection(ctx, args.userId, "chatgpt");
    if (!chatgpt) {
      await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
        body: "ChatGPT のトークンがありません",
        createdAt: args.createdAt + 1,
        externalId: `error:${args.createdAt}`,
        kind: "work",
        role: "assistant",
        workspaceId: args.workspaceId,
      });
      return null;
    }

    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: "Codex Cloud に送っています",
      createdAt: args.createdAt + 1,
      externalId: `pending:${args.createdAt}`,
      kind: "work",
      role: "assistant",
      workspaceId: args.workspaceId,
    });

    const accountId =
      (await resolveCodexAccountId(chatgpt.accessToken)) ??
      (chatgpt.accountId.length > 0 ? chatgpt.accountId : undefined);
    const auth = { accessToken: chatgpt.accessToken, accountId };

    let taskId: string;
    try {
      taskId = await createCodexTask(
        auth,
        workspace.codexEnvironmentId,
        args.prompt
      );
    } catch (error) {
      await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
        body:
          error instanceof Error
            ? error.message
            : "Codex Cloud に送れませんでした",
        externalId: `pending:${args.createdAt}`,
        kind: "work",
        role: "assistant",
        workspaceId: args.workspaceId,
      });
      return null;
    }

    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: `タスク ${taskId}`,
      externalId: `pending:${args.createdAt}`,
      kind: "work",
      role: "assistant",
      workspaceId: args.workspaceId,
    });

    const deadline = Date.now() + 8 * 60 * 1000;
    while (Date.now() < deadline) {
      try {
        const snapshot = await getCodexTaskSnapshot(auth, taskId);
        await persistSnapshot(ctx, args.workspaceId, taskId, snapshot);
        if (isCodexTaskDone(snapshot)) {
          return null;
        }
      } catch (error) {
        await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
          body:
            error instanceof Error
              ? error.message
              : "Codex Cloud の進捗を取れませんでした",
          externalId: `${taskId}:work`,
          kind: "work",
          role: "assistant",
          workspaceId: args.workspaceId,
        });
        return null;
      }
      await sleep(3500);
    }
    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: "まだ動いています。少し待ってから続きを送ってください。",
      externalId: `${taskId}:work`,
      kind: "work",
      role: "assistant",
      workspaceId: args.workspaceId,
    });
    return null;
  },
  returns: v.null(),
});
