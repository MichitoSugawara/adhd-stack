# Phase 5: `adhd.gawarago.com` 切替（準備）

ADHD Stack **本体**のホスト切替。ユーザーアプリの Pages / Convex 公開（Phase 4）とは別物です。

現在の [https://adhd.gawarago.com](https://adhd.gawarago.com) は静的 Pages のフロントモックです。切替後は `apps/web` の OpenNext Workers + Convex 本番です。

## 手順（本番だけ）

1. Convex 本番にスキーマと関数を出す。開発は `pnpm convex:dev`。本番だけ `npx convex deploy`。
2. Convex 本番の環境変数を入れる（`SITE_URL=https://adhd.gawarago.com`、`JWT_PRIVATE_KEY`、`JWKS`、ChatGPT 以外の接続用シークレット、`OPENCONNECTOR_*`、`CLOUDFLARE_CLIENT_*`）。
3. Cloudflare OAuth クライアントのコールバックを本番の `https://<deployment>.convex.site/oauth/callback/cloudflare` に合わせる。
4. OpenConnector 側の GitHub / Convex コールバックも本番に向ける。
5. Workers に `NEXT_PUBLIC_CONVEX_URL` と `NEXT_PUBLIC_CONVEX_SITE_URL` を入れて `pnpm --filter @adhd-stack/web deploy`。認可は新しいタブ（`window.open(url, "_blank")` のあと `popup.opener = null`）。feature に `noopener` を付けて `null` 判定すると二重認可になるので使わない。本当にブロックされたときだけ同一タブへ。`SITE_URL=https://adhd.gawarago.com`。戻り先は `/connect?oc=&name=`。元のタブは `confirmOcConnect` をポーリングする。
6. `adhd.gawarago.com` の DNS を、モック Pages から Workers に付け替える。
7. 切替後にログインせず、接続 4 カードが「つながったように」見えないことを確認する。

## この環境での go / no-go

**no-go（本番デプロイはしない）。**

| ブロッカー                             | 状態                     |
| -------------------------------------- | ------------------------ |
| `NEXT_PUBLIC_CONVEX_URL`               | 未設定                   |
| Convex 本番デプロイキー                | なし                     |
| ホスト用 Cloudflare / Workers 資格情報 | なし                     |
| OpenConnector 本番 URL / トークン      | なし                     |
| DNS 変更権限                           | このエージェントにはない |

資格情報が揃うまで、親が切替を実行する。こちらからは `npx convex deploy` も Workers 本番デプロイもしない。
