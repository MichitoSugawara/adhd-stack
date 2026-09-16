export type PagesDeployStatus = "failure" | "started" | "success";

export const CONVEX_FUNCTION_PUSH_NOTE =
  "関数は Pages ビルドの convex deploy で載ります。この画面から送りません。";

export const PAGES_DEPLOY_STARTED_NOTE =
  "Pages のビルドを始めました。完了はまだ見ていません。関数はそのあとです。";

export const OFFLINE_PUBLISH_NOTE = "Convex 未設定のため公開できません。";

export const hasFunctionPushOutcome = (notes: readonly string[]): boolean =>
  notes.some((note) =>
    /デプロイキー|convex deploy|関数は次の|関数の自動プッシュ|関数は未実施/u.test(
      note
    )
  );

export const hasPagesDeployStarted = (notes: readonly string[]): boolean =>
  notes.some((note) => /ビルドを始めました|完了はまだ見ていません/u.test(note));

export const isPublishInfoNote = (note: string): boolean =>
  /デプロイキー|関数は Pages|関数は次の|関数の自動プッシュ|関数は未実施|完了はまだ見ていません|ビルドを始めました/u.test(
    note
  );

export const isPagesBuildPending = (
  pending: boolean,
  status?: PagesDeployStatus | null,
  notes: readonly string[] = []
): boolean => {
  if (pending) {
    return true;
  }
  if (status === "started") {
    return true;
  }
  if (status === "success" || status === "failure") {
    return false;
  }
  return hasPagesDeployStarted(notes);
};
