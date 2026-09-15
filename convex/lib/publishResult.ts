export const CONVEX_FUNCTION_PUSH_NOTE =
  "関数はホストからバンドルしません。公開時にデプロイキーを Cloudflare Pages 本番へ載せ、Pages ビルドの convex deploy で送ります。";

export const PAGES_DEPLOY_STARTED_NOTE =
  "Pages: デプロイを開始しました。完了は Pages のログで確認してください。この画面からは待っていません。";

export type FunctionPushStatus =
  | "configured"
  | "failed"
  | "key_only"
  | "skipped";

export const noteForFunctionPush = (status: FunctionPushStatus): string => {
  if (status === "configured") {
    return "Convex: デプロイキーを Cloudflare Pages 本番に載せ、ビルドを convex deploy にしました。関数は次の Pages ビルド完了後に載ります。この画面からは完了を待っていません。";
  }
  if (status === "key_only") {
    return "Convex: デプロイキーは発行しましたが、Cloudflare Pages への載せに失敗したため関数は未実施です。";
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

export interface PublishResult {
  cloudflarePagesUrl: string | null;
  convexUrl: string | null;
  error: string | null;
  notes: string[];
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
  if (result.cloudflarePagesUrl || result.convexUrl) {
    return `このアプリを公開しました。\n${lines.join("\n")}`;
  }
  return `公開は完了していません。\n${lines.join("\n")}`;
};
