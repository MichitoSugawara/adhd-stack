import type { PagesDeployStatus } from "@/lib/publish-copy";

export type PublishPhase = "done" | "failed" | "idle" | "working";
export type PublishStepState = "done" | "fail" | "running" | "wait";

export interface PublishStepRow {
  detail: string;
  key: "pages" | "settings" | "url";
  label: string;
  progress: boolean;
  state: PublishStepState;
}

export const publishPhase = (
  pending: boolean,
  waiting: boolean,
  status?: PagesDeployStatus | null
): PublishPhase => {
  if (pending || waiting) {
    return "working";
  }
  if (status === "success") {
    return "done";
  }
  if (status === "failure") {
    return "failed";
  }
  return "idle";
};

const settingsState = (phase: PublishPhase): PublishStepState => {
  if (phase === "idle") {
    return "wait";
  }
  return "done";
};

const pagesState = (phase: PublishPhase): PublishStepState => {
  if (phase === "idle") {
    return "wait";
  }
  if (phase === "working") {
    return "running";
  }
  if (phase === "failed") {
    return "fail";
  }
  return "done";
};

const urlState = (phase: PublishPhase): PublishStepState => {
  if (phase === "done") {
    return "done";
  }
  return "wait";
};

const pagesLabel = (state: PublishStepState): string => {
  if (state === "running") {
    return "ページを組み立てています";
  }
  if (state === "fail") {
    return "ページの組み立てに失敗";
  }
  return "ページを組み立てて";
};

const pagesDetail = (state: PublishStepState): string => {
  if (state === "running") {
    return "待ち";
  }
  if (state === "fail") {
    return "失敗";
  }
  if (state === "done") {
    return "完了";
  }
  return "待機";
};

const settingsDetail = (state: PublishStepState): string => {
  if (state === "done") {
    return "完了";
  }
  return "待機";
};

const urlDetail = (state: PublishStepState): string => {
  if (state === "done") {
    return "完了";
  }
  return "待機";
};

export const publishStepRows = (phase: PublishPhase): PublishStepRow[] => {
  const pages = pagesState(phase);
  return [
    {
      detail: settingsDetail(settingsState(phase)),
      key: "settings",
      label: "設定を確認",
      progress: false,
      state: settingsState(phase),
    },
    {
      detail: pagesDetail(pages),
      key: "pages",
      label: pagesLabel(pages),
      progress: pages === "running",
      state: pages,
    },
    {
      detail: urlDetail(urlState(phase)),
      key: "url",
      label: "URLを確認",
      progress: false,
      state: urlState(phase),
    },
  ];
};

export const phaseChip = (phase: PublishPhase): string => {
  if (phase === "working") {
    return "まだ公開されていません";
  }
  if (phase === "done") {
    return "公開済み";
  }
  if (phase === "failed") {
    return "失敗";
  }
  return "未公開";
};

export const phaseTitle = (phase: PublishPhase): string => {
  if (phase === "working") {
    return "公開しています";
  }
  if (phase === "done") {
    return "公開できました";
  }
  if (phase === "failed") {
    return "公開に失敗しました";
  }
  return "公開の3ステップ";
};
