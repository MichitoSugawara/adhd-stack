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
