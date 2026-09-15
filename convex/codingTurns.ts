"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { loadFreshConnection } from "./lib/actionAuth";
import { getCodingBackend } from "./lib/codingBackends";
import { persistNormalizedTurn } from "./lib/codingTurnPersist";
import { isRetryableError } from "./lib/httpRetry";

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const runTurn = internalAction({
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
    const environmentId =
      workspace?.codingEnvironmentId ?? workspace?.codexEnvironmentId;
    if (!(workspace && environmentId && workspace.githubRepoUrl)) {
      await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
        body: "実行環境がまだありません",
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
        body: "ChatGPT の接続がありません",
        createdAt: args.createdAt + 1,
        externalId: `error:${args.createdAt}`,
        kind: "work",
        role: "assistant",
        workspaceId: args.workspaceId,
      });
      return null;
    }

    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: "実行環境に送っています",
      createdAt: args.createdAt + 1,
      externalId: `pending:${args.createdAt}`,
      kind: "work",
      role: "assistant",
      workspaceId: args.workspaceId,
    });

    const backend = getCodingBackend(workspace.codingBackend);
    let taskId: string;
    try {
      const started = await backend.startTurn({
        chatgptAccessToken: chatgpt.accessToken,
        chatgptAccountId: chatgpt.accountId,
        environmentId,
        prompt: args.prompt,
      });
      ({ taskId } = started);
    } catch (error) {
      await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
        body:
          error instanceof Error ? error.message : "実行環境に送れませんでした",
        externalId: `pending:${args.createdAt}`,
        kind: "work",
        role: "assistant",
        workspaceId: args.workspaceId,
      });
      return null;
    }

    await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
      body: `作業 ${taskId}`,
      externalId: `pending:${args.createdAt}`,
      kind: "work",
      role: "assistant",
      workspaceId: args.workspaceId,
    });

    const deadline = Date.now() + 8 * 60 * 1000;
    while (Date.now() < deadline) {
      try {
        const snapshot = await backend.pollTurn({
          chatgptAccessToken: chatgpt.accessToken,
          chatgptAccountId: chatgpt.accountId,
          taskId,
        });
        await persistNormalizedTurn(ctx, args.workspaceId, taskId, snapshot);
        if (backend.isTurnDone(snapshot)) {
          return null;
        }
      } catch (error) {
        if (isRetryableError(error) && Date.now() < deadline) {
          await sleep(3500);
          continue;
        }
        await ctx.runMutation(internal.workspaceInternal.upsertArtifact, {
          body:
            error instanceof Error
              ? error.message
              : "実行環境の進捗を取れませんでした",
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
