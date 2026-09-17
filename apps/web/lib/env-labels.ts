export type EnvKind = "preview" | "production" | "staging";

export const ENV_LABEL: Record<EnvKind, string> = {
  preview: "プレビュー",
  production: "本番",
  staging: "検証",
};

export const ENV_STATUS = {
  failed: "反映失敗",
  input: "入力待ち",
  none: "まだ",
  published: "反映済み",
  review: "要確認",
  staged: "検証済み",
  unpublished: "未反映",
  waiting: "待機中",
  working: "作業中",
} as const;

export const PREVIEW_UNAVAILABLE =
  "プレビュー用のページはまだ切っています。作ったようには見せません。";

export const STAGING_UNAVAILABLE =
  "検証用のページはまだありません。差を見たり、本番へ送ったりはできません。";

export const ROLLBACK_UNAVAILABLE =
  "前の版に戻す操作はまだありません。履歴もまだありません。";

export const PREVIEW_FROM_UNAVAILABLE =
  "検証版・本番版・既存プレビューのどれからも、まだ作れません。";

export const PROMOTE_UNAVAILABLE = "検証から本番へ送る操作は、まだありません。";

export const HISTORY_UNAVAILABLE =
  "履歴はまだありません。前の版に戻すこともできません。";

export const SEND_STAGING_UNAVAILABLE = "検証へ送る操作は、まだありません。";

export const changeNoteFrom = (changes: {
  add: number;
  del: number;
  files: readonly string[];
}): string => {
  if (changes.files.length === 0) {
    return "まとまった変更はまだありません。";
  }
  const counts =
    changes.add + changes.del > 0
      ? ` · +${String(changes.add)} / -${String(changes.del)}`
      : "";
  return `${String(changes.files.length)} ファイル${counts}`;
};

export const listAppStatus = (
  pagesUrl: string | null,
  pagesDeployStatus: string | undefined,
  provisionStatus: string
): { label: string; tone: "fail" | "idle" | "ok" | "wait" } => {
  if (pagesDeployStatus === "failure" || provisionStatus === "error") {
    return { label: ENV_STATUS.failed, tone: "fail" };
  }
  if (pagesDeployStatus === "started" || provisionStatus === "provisioning") {
    return { label: ENV_STATUS.working, tone: "wait" };
  }
  if (pagesUrl) {
    return { label: ENV_STATUS.published, tone: "ok" };
  }
  if (provisionStatus === "ready") {
    return { label: ENV_STATUS.unpublished, tone: "idle" };
  }
  return { label: ENV_STATUS.waiting, tone: "wait" };
};

export const previewBody = (previewUrl: string | null): string => {
  if (previewUrl) {
    return "いま開いているプレビューです。新しいプレビューはまだ切れません。";
  }
  return PREVIEW_UNAVAILABLE;
};

export const previewChip = (
  previewUrl: string | null
): { status: string; tone: "idle" | "ok" } => {
  if (previewUrl) {
    return { status: ENV_STATUS.published, tone: "ok" };
  }
  return { status: ENV_STATUS.none, tone: "idle" };
};

export const isProvisioningStatus = (status: string | undefined): boolean =>
  status === "pending" || status === "provisioning";

export const previewColumnState = (args: {
  hasProduction: boolean;
  previewCount: number;
  provisioning: boolean;
}): { body: string; label: string; tone: "idle" | "ok" | "wait" } => {
  if (args.previewCount > 0) {
    return {
      body: "制作中のアプリを開いて、使い心地を確かめましょう。",
      label: `${String(args.previewCount)} 件`,
      tone: "ok",
    };
  }
  if (args.provisioning) {
    return {
      body: "公開先を用意しています。準備が終わると、プレビューの URL がここに表示されます。",
      label: "準備中",
      tone: "wait",
    };
  }
  if (args.hasProduction) {
    return {
      body: "プレビュー専用の URL はまだありません。本番の URL で表示を確認できます。",
      label: "未作成",
      tone: "idle",
    };
  }
  return {
    body: "制作中のアプリを試す場所です。プレビューの URL はまだありません。",
    label: "未作成",
    tone: "idle",
  };
};

export const productionColumnState = (args: {
  pages: string | null;
  provisioning: boolean;
  started: boolean;
}): { body: string; label: string; tone: "idle" | "ok" | "wait" } => {
  if (args.started) {
    return {
      body: "本番のビルドを実行中です。公開の完了を待っています。",
      label: "ビルド中",
      tone: "wait",
    };
  }
  if (args.pages) {
    return {
      body: "みんなに届けるアプリの URL です。変更は、公開の操作をすると反映されます。",
      label: "URL あり",
      tone: "ok",
    };
  }
  if (args.provisioning) {
    return {
      body: "本番の公開先を用意しています。完了すると URL がここに表示されます。",
      label: "準備中",
      tone: "wait",
    };
  }
  return {
    body: "できあがったアプリを公開する場所です。まだ公開されていません。",
    label: "未公開",
    tone: "idle",
  };
};
