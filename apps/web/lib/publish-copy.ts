export const CONVEX_FUNCTION_PUSH_NOTE =
  "関数はホストからバンドルしません。公開時にデプロイキーを Cloudflare Pages 本番へ載せ、Pages ビルドの convex deploy で送ります。";

export const OFFLINE_PUBLISH_NOTE =
  "Convex 未設定のため公開できません。偽の URL は出しません。";

export const hasFunctionPushOutcome = (notes: readonly string[]): boolean =>
  notes.some((note) =>
    /デプロイキー|convex deploy|関数は次の|関数の自動プッシュ|関数は未実施/u.test(
      note
    )
  );
