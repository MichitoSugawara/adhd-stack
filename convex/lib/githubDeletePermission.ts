export const GITHUB_DELETE_PERMISSION_MESSAGE =
  "リポジトリを消す権限がありません。GitHub をつなぎ直し、削除権限（delete_repo / 管理者）を許可してください";

export const isGitHubDeletePermissionError = (
  status?: number,
  detail?: string
): boolean => {
  if (status === 403) {
    return true;
  }
  const lower = (detail ?? "").toLowerCase();
  return (
    lower.includes("must have admin rights") ||
    lower.includes("admin rights to repository") ||
    /(?:^|[^a-z_])delete_repo(?:[^a-z_]|$)/u.test(lower)
  );
};
