import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import type { ActionCtx } from "../_generated/server";
import type { NormalizedTurn } from "./codingEvents";
import { summarizeDiff } from "./codexCloud";

export const persistNormalizedTurn = async (
  ctx: ActionCtx,
  workspaceId: Id<"workspaces">,
  taskId: string,
  snapshot: NormalizedTurn
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
