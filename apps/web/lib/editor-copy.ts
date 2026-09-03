import type { Doc } from "../../../convex/_generated/dataModel";

export const KIND_LABELS = {
  command: "コマンド",
  diff: "ファイル差分",
  text: "",
  thinking: "考え中",
  work: "いまやってること",
} as const;

export type EditorRail = "chat" | "commands" | "files";

export const filterThread = (
  thread: Doc<"messages">[],
  rail: EditorRail
): Doc<"messages">[] => {
  if (rail === "files") {
    return thread.filter((message) => message.kind === "diff");
  }
  if (rail === "commands") {
    return thread.filter((message) => message.kind === "command");
  }
  return thread;
};

export const isEditorReady = (
  workspace:
    | Pick<
        Doc<"workspaces">,
        "codexEnvironmentId" | "githubRepoUrl" | "provisionStatus"
      >
    | null
    | undefined
): boolean =>
  Boolean(
    workspace?.provisionStatus === "ready" &&
    workspace.githubRepoUrl &&
    workspace.codexEnvironmentId
  );

export const provisionHeadline = (
  workspace:
    | Pick<
        Doc<"workspaces">,
        "codexEnvironmentId" | "githubRepoUrl" | "provisionStatus"
      >
    | null
    | undefined
): string => {
  if (!workspace) {
    return "リポジトリと環境を用意しています";
  }
  if (isEditorReady(workspace)) {
    return "準備完了";
  }
  if (workspace.provisionStatus === "error") {
    return "準備に失敗しました";
  }
  return "リポジトリと環境を用意しています";
};
