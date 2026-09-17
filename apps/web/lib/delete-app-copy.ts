export const DELETE_RESOURCE_LABELS = {
  cloudflare_pages: "公開ページ",
  codex_environment: "実行環境",
  convex_project: "アプリのデータ",
  github_repo: "保存先",
  local_records: "この画面の記録",
} as const;

export const DELETE_STATUS_LABELS = {
  already_gone: "すでにありませんでした",
  blocked: "ホストのため残しました",
  deleted: "削除しました",
  failed: "削除できませんでした",
  skipped: "対象なし",
  unsupported: "消せませんでした",
} as const;

export type DeleteResourceKind = keyof typeof DELETE_RESOURCE_LABELS;
export type DeleteResourceStatus = keyof typeof DELETE_STATUS_LABELS;
