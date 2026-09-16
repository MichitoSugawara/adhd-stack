import type { NormalizedTurn } from "./codingEvents";

export const CURSOR_API_KEY_MISSING =
  "Cursor の API キーがありません。Convex に CURSOR_API_KEY を入れてください。偽の実行はしません。";

export const CURSOR_RUN_DONE = new Set([
  "CANCELLED",
  "ERROR",
  "EXPIRED",
  "FINISHED",
]);

export interface CursorTaskRef {
  agentId: string;
  runId: string;
}

export interface CursorBranchRef {
  branch?: string;
  prUrl?: string;
  repoUrl?: string;
}

export interface CursorRunSnapshot {
  git?: {
    branches?: CursorBranchRef[];
  };
  result?: string;
  status?: string;
}

export const cursorRepoHandle = (repoUrl: string): string =>
  `cursor-repo:${repoUrl}`;

export const isCursorAgentId = (value: string): boolean =>
  value.startsWith("bc-");

export const parseCursorTaskId = (taskId: string): CursorTaskRef => {
  const [agentId, runId] = taskId.split("/");
  if (!(agentId && runId && isCursorAgentId(agentId))) {
    throw new Error("Cursor の作業番号が不正です");
  }
  return { agentId, runId };
};

export const formatCursorTaskId = (agentId: string, runId: string): string =>
  `${agentId}/${runId}`;

export const labelFromRepoUrl = (repoUrl: string): string => {
  const trimmed = repoUrl.replace(/\.git$/u, "").replace(/\/$/u, "");
  const name = trimmed.split("/").at(-1);
  return (name && name.length > 0 ? name : "workspace").slice(0, 100);
};

export const isCursorRunDone = (status: string | undefined): boolean =>
  status !== undefined && CURSOR_RUN_DONE.has(status);

export const workLabelForCursorStatus = (
  status: string | undefined
): string => {
  if (status === "CREATING") {
    return "実行環境を起こしています";
  }
  if (status === "RUNNING") {
    return "実行中";
  }
  if (status === "FINISHED") {
    return "完了";
  }
  if (status === "ERROR") {
    return "失敗";
  }
  if (status === "CANCELLED") {
    return "取り消されました";
  }
  if (status === "EXPIRED") {
    return "期限切れ";
  }
  return status ?? "作業中";
};

export const mapCursorRunToTurn = (
  snapshot: CursorRunSnapshot
): NormalizedTurn => {
  const branches = snapshot.git?.branches ?? [];
  const files = branches
    .map((row) => row.prUrl ?? row.branch ?? row.repoUrl)
    .filter((item): item is string => Boolean(item));
  const texts: string[] = [];
  if (snapshot.result) {
    texts.push(snapshot.result);
  }
  for (const row of branches) {
    if (row.prUrl) {
      texts.push(row.prUrl);
    }
  }
  const failed = snapshot.status === "ERROR";
  return {
    commands: [],
    error: failed
      ? (snapshot.result ?? "Cursor Cloud Agent の実行が失敗しました")
      : undefined,
    files,
    status: snapshot.status,
    texts: failed ? [] : texts,
    thinking: [],
    work: workLabelForCursorStatus(snapshot.status),
  };
};
