export const CONVEX_FUNCTION_PUSH_NOTE =
  "関数は Pages ビルドの convex deploy で載ります。この画面から送りません。";

export const PAGES_DEPLOY_STARTED_NOTE =
  "Pages のビルドを始めました。完了はまだ見ていません。関数はそのあとです。";

export const PAGES_DEPLOY_DONE_NOTE =
  "Pages のビルドは終わりました。関数もこのビルドで載ります。";

export const PAGES_DEPLOY_DONE_WITHOUT_FUNCTIONS_NOTE =
  "Pages のビルドは終わりました。関数の自動プッシュは未実施のままです。";

export const PAGES_DEPLOY_FAILED_NOTE = "Pages のビルドは失敗しました。";

export type FunctionPushStatus =
  | "configured"
  | "failed"
  | "key_only"
  | "skipped";

export type PagesDeployStatus = "failure" | "started" | "success";

export const noteForFunctionPush = (status: FunctionPushStatus): string => {
  if (status === "configured") {
    return "Convex: デプロイキーを Pages に載せ、ビルドを convex deploy にしました。関数は次の Pages ビルドのあとに載ります。完了はまだ見ていません。";
  }
  if (status === "key_only") {
    return "Convex: デプロイキーは発行しましたが、Pages への載せに失敗したため関数は未実施です。";
  }
  if (status === "skipped") {
    return "Convex: 本番デプロイ名が無いため、デプロイキーを発行できませんでした。関数は未実施です。";
  }
  return "Convex: デプロイキーを発行できず、関数の自動プッシュは未実施です。";
};

export const hasFunctionPushOutcome = (notes: readonly string[]): boolean =>
  notes.some((note) =>
    /デプロイキー|convex deploy|関数は次の|関数の自動プッシュ|関数は未実施/u.test(
      note
    )
  );

export const hasConfiguredFunctionPush = (notes: readonly string[]): boolean =>
  notes.some((note) => /デプロイキーを Pages に載せ/u.test(note));

export const hasPagesDeployStarted = (notes: readonly string[]): boolean =>
  notes.some((note) => /ビルドを始めました|完了はまだ見ていません/u.test(note));

export const pagesStatusFromStage = (stage?: string): PagesDeployStatus => {
  if (stage === "success") {
    return "success";
  }
  if (
    stage === "canceled" ||
    stage === "cancelled" ||
    stage === "failed" ||
    stage === "failure"
  ) {
    return "failure";
  }
  return "started";
};

export const notesAfterPagesRefresh = (
  notes: readonly string[],
  status: PagesDeployStatus,
  outcome: string | null
): string[] => {
  const kept = notes.filter((note) => note !== PAGES_DEPLOY_STARTED_NOTE);
  if (outcome && !kept.includes(outcome)) {
    return [...kept, outcome];
  }
  if (status === "started") {
    return [...notes];
  }
  return kept;
};

export const publishErrorAfterPagesRefresh = (
  status: PagesDeployStatus,
  previous?: string
): string => {
  if (status === "failure") {
    return "Pages: デプロイが失敗しました";
  }
  if (status === "success") {
    return "";
  }
  return previous ?? "";
};

export const noteForPagesOutcome = (
  status: PagesDeployStatus,
  notes: readonly string[]
): string | null => {
  if (status === "started") {
    return null;
  }
  if (status === "failure") {
    return PAGES_DEPLOY_FAILED_NOTE;
  }
  if (hasConfiguredFunctionPush(notes)) {
    return PAGES_DEPLOY_DONE_NOTE;
  }
  return PAGES_DEPLOY_DONE_WITHOUT_FUNCTIONS_NOTE;
};

export interface PublishResult {
  cloudflarePagesUrl: string | null;
  convexUrl: string | null;
  error: string | null;
  notes: string[];
  pagesDeployStatus?: PagesDeployStatus;
}

export interface PagesRefreshResult {
  error: string | null;
  notes: string[];
  pagesDeployStatus: PagesDeployStatus | null;
  pagesUrl: string | null;
}

export const asStoredHttpUrl = (
  value: string | undefined | null
): string | undefined => {
  if (!value) {
    return undefined;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }
  return undefined;
};

export const summarizePublish = (result: PublishResult): string => {
  const lines = [
    `Pages: ${result.cloudflarePagesUrl ?? "なし"}`,
    `Convex: ${result.convexUrl ?? "なし"}`,
    ...result.notes,
  ];
  if (result.error) {
    lines.push(result.error);
  }
  if (result.pagesDeployStatus === "success") {
    return `Pages のビルドは終わりました。\n${lines.join("\n")}`;
  }
  if (result.cloudflarePagesUrl || result.convexUrl) {
    return `公開を始めました。完了はまだ見ていません。\n${lines.join("\n")}`;
  }
  return `公開は完了していません。\n${lines.join("\n")}`;
};
