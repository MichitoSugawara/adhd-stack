export const CONVEX_FUNCTION_PUSH_NOTE =
  "Convex: プロジェクトと本番デプロイはあります。関数のプッシュはこのサーバーからバンドルできないため未実施です。手動または CI で push してください。";

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
