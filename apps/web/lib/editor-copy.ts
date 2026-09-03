import type { MockMessage, MockWorkspace } from "./mock-types";

export const KIND_LABELS = {
  command: "command",
  diff: "diff",
  text: "",
  thinking: "thinking",
  work: "work",
} as const;

export type EditorRail = "chat" | "commands" | "files";

export const filterThread = (
  thread: MockMessage[],
  rail: EditorRail
): MockMessage[] => {
  if (rail === "files") {
    return thread.filter((message) => message.kind === "diff");
  }
  if (rail === "commands") {
    return thread.filter((message) => message.kind === "command");
  }
  return thread;
};

export const isEditorReady = (
  workspace: Pick<
    MockWorkspace,
    "codexEnvironmentId" | "githubRepoUrl" | "provisionStatus"
  > | null
): boolean =>
  Boolean(
    workspace?.provisionStatus === "ready" &&
    workspace.githubRepoUrl &&
    workspace.codexEnvironmentId
  );

export const provisionHeadline = (
  workspace: Pick<
    MockWorkspace,
    "codexEnvironmentId" | "githubRepoUrl" | "provisionStatus"
  > | null
): string => {
  if (!workspace) {
    return "モックのリポジトリと環境を用意しています";
  }
  if (isEditorReady(workspace)) {
    return "デモ準備完了 · モックデータ";
  }
  if (workspace.provisionStatus === "error") {
    return "デモ準備に失敗しました";
  }
  return "モックのリポジトリと環境を用意しています";
};
