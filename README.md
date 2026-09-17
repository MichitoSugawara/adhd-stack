# ADHD Stack

何も考えずに始められる開発と公開。ホストは `adhd.gawarago.com`。

ChatGPT、GitHub、Cloudflare、Convex をつなぎ、名前とアイデアからアプリを作ります。会話とプレビューを並べて確かめ、準備ができたら自分のアカウントへ公開します。サイドバーから一覧と接続に戻れ、`⌘K` / `Ctrl+K` で検索・移動できます。

## いまの状態

v1+ の方向は [docs/requirements.md](docs/requirements.md) が正本です。UI はライトテーマの **Paper Studio**。Beautiful UI の部品、Circle のナビゲーション、Kitesurf のプレビュー操作、OpenTUI のキー設計を基にしています。参照元と画面仕様は [docs/ui-redesign.md](docs/ui-redesign.md)。接続は OpenConnector、生成アプリのテンプレートは [tahcode](https://github.com/MichitoSugawara/tahcode) 由来、実行系は pluggable な CodingBackend。`design_handoff/` は移行用の IA / ジャーニー参考であり、最終デザインではありません。

このリポジトリは Turborepo の `apps/web`（Next.js App Router）と、ルートの `convex/`（Convex バックエンド）です。ADHD Stack 本体は OpenNext（`@opennextjs/cloudflare`）で Cloudflare Workers に出し、データとリアルタイムは Convex に置きます。名前付き作成とチャットは CodingBackend（既定は GitHub + Codex Cloud Environment。第二実装は Cursor Cloud Agent。切り替えは [docs/coding-backends.md](docs/coding-backends.md)）です。公開は開いているアプリの Cloudflare Pages + Convex に出し、同じ画面に URL を返します。Convex の関数プッシュはこのサーバーからできないので、手動または CI のままです。ホスト `adhd.gawarago.com` の本番切替は次の段階です。

このブランチの `apps/web` は暖かい紙色と白い作業面を使い、Inter / Noto Sans JP / Geist Mono で統一しています。`/connect` は ConnectionsPort 経由の実接続です。新規入力は同じタブに保存し、作成後は未送信のチャット下書きへ引き継ぎます。バックエンド未設定時は「UI プレビュー」と表示し、実際に接続・生成・公開したようには見せません。Google ログインと API キーカードはありません。今回の UI 更新は本番ホストへの反映や実 OAuth・生成・公開の完了を示すものではありません。

## 動かし方

```sh
pnpm install
cp .env.example apps/web/.env.local
# NEXT_PUBLIC_CONVEX_URL と SITE_URL を入れる
pnpm convex:dev
# 別ターミナル
pnpm dev
```

品質チェックは `pnpm check`、型チェックは `pnpm typecheck`、本番ビルドは `pnpm build`。

Convex Auth の JWT 鍵は初回だけ必要です。

```sh
npx @convex-dev/auth
```

これが `SITE_URL`、`JWT_PRIVATE_KEY`、`JWKS` を Convex デプロイに入れます。`SITE_URL` はローカルなら `http://localhost:3000`、本番なら `https://adhd.gawarago.com` です。

クラウドのコーディングエージェントが触る場合は、自分の dev デプロイとぶつからないよう `CONVEX_AGENT_MODE=anonymous` を使います。

## 必要な OAuth アプリ

方針の正本は [docs/requirements.md](docs/requirements.md)。GitHub / Convex は OpenConnector（`OPENCONNECTOR_BASE_URL` + `OPENCONNECTOR_ADMIN_TOKEN`）。Cloudflare Pages はカタログに無いので現行カスタム OAuth を ConnectionsPort の裏に残す。ChatGPT は Codex のデバイスログインのまま（OpenConnector の openai API キー接続は使わない）。値はコミットしないでください。

Cloudflare のコールバック URL は Convex の HTTP Actions です。デプロイ URL の `.cloud` を `.site` にした origin を使います。GitHub / Convex の認可コールバックは OpenConnector 側（`/oauth/callback`）です。

| サービス | 作る場所 | コールバック | Convex 環境変数 |
| --- | --- | --- | --- |
| ChatGPT | 不要（Codex デバイスログイン） | なし。画面の大きなコードをコピーし、ログイン後に入力 | なし |
| GitHub | OpenConnector に GitHub OAuth アプリを設定 | OpenConnector の `/oauth/callback` | `OPENCONNECTOR_BASE_URL` `OPENCONNECTOR_ADMIN_TOKEN` |
| Cloudflare | Cloudflare → Manage Account → OAuth clients | `https://<deployment>.convex.site/oauth/callback/cloudflare` | `CLOUDFLARE_CLIENT_ID` `CLOUDFLARE_CLIENT_SECRET` |
| Convex | OpenConnector に Convex team OAuth アプリを設定 | OpenConnector の `/oauth/callback` | `OPENCONNECTOR_BASE_URL` `OPENCONNECTOR_ADMIN_TOKEN` |

フロントの `NEXT_PUBLIC_CONVEX_URL` と `NEXT_PUBLIC_CONVEX_SITE_URL` は公開してよいデプロイ URL です。シークレットは Convex 側だけに置きます。

### Cursor Cloud Agent（エンジン 2）

既定は Codex のままです。切替手順は [docs/coding-backends.md](docs/coding-backends.md)。Convex に `CURSOR_API_KEY`。任意で `ADHD_CODING_BACKEND=cursor_cloud`、`ORIGIN_TOKEN`、`ORIGIN_OWNER_SLUG`。Cursor の API キーは Origin の Bearer には使えません。画面にバックエンド選択は出しません。

### ChatGPT

- Codex CLI と同じデバイスログインです。OpenAI の Sign-in-with-ChatGPT アプリは作りません。
- 公開クライアント ID は Codex CLI の `app_EMoamEEZ73f0CkXaXp7hrann` です。シークレットではありません。
- ユーザーコード発行: `https://auth.openai.com/api/accounts/deviceauth/usercode`
- 入力ページ: `https://auth.openai.com/codex/device`。`?user_code=` はログインで消えるので頼らない。画面のコードが正。ログインしたらこのコードを入力。
- ポーリング: `https://auth.openai.com/api/accounts/deviceauth/token`
- トークン交換: `https://auth.openai.com/oauth/token`（`redirect_uri` は `https://auth.openai.com/deviceauth/callback`）
- Cloud Environments / Codex Cloud は Plus 以上が必要です。Free と Go では足りません。
- GitHub リポジトリと実行環境は、作成画面の名前から作ります。`adhd-app` 固定はありません。テンプレートは tahcode 由来（`ADHD_TEMPLATE_REPO` があれば GitHub テンプレート、無ければ最小足場）。偽の成功は出しません。
- 実行環境は Codex CLI と同じ `POST /wham/environments` です。`originator: codex_cli_rs` は HTTP ヘッダです。`machine_id` は取れなければ `wham-public/wham-universal`（`/wham/machines` が空なのは普通です）。`repos` は `github-{id}` の文字列で、id は `GET /wham/github/repositories/search/all-installations?query=` にリポジトリ名を入れて取ります。GitHub OAuth の `/repos` は使いません。ChatGPT 側にリポジトリが見えないときだけ https://chatgpt.com/codex で GitHub を繋いでください。

### GitHub

- [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- スコープ: `repo` `delete_repo` `read:user` `user:email`
- リポジトリのホストです。接続後、アカウント側に作業用リポジトリを用意します。
- メールは `user:email` で `/user/emails` から取り、Convex ユーザーに残します。ChatGPT デバイスログインが同じ人に繋がるようにするためです。

接続画面を開くと、同じ人の分割アカウント（GitHub 先行と ChatGPT メールなど）をまとめます。ログイン中の次のプロバイダは、今のユーザーに付けます。新しいユーザーは作りません。

まとまらないときは Convex ダッシュボードで `internal.oauthInternal.mergeUsers` を実行してください。`keepUserId` は残すユーザー、`absorbUserId` は吸収するユーザーです。今のセッションを残すなら、ログイン中のユーザーを keep にしてください。同じ slug のワークスペースは keep 側に寄せます。absorb 側の行は消しません（email だけ外します）。

### Cloudflare

- [Create your OAuth client](https://developers.cloudflare.com/fundamentals/oauth/create-an-oauth-client/)
- 認可: `https://dash.cloudflare.com/oauth2/auth`
- トークン: `https://dash.cloudflare.com/oauth2/token`
- OAuth クライアントの Grant type に `refresh_token` を入れてください。こちらは認可で `offline_access` を要求します。
- ユーザーアプリのフロントは、つながったアカウントの Cloudflare Pages に出します。
- 新規クライアントは private です。他人のアカウントでも使うなら public 化とドメイン確認が必要です。

### Convex

- [OAuth Applications](https://docs.convex.dev/platform-apis/oauth-applications)
- 認可: `https://dashboard.convex.dev/oauth/authorize/team`
- トークン: `https://api.convex.dev/oauth/token`
- ユーザーアプリの API / DB は、つながったアカウントの Convex に出します。

接続アプリが未設定のサービスは「設定待ち」と表示し、接続操作を無効にします。偽のトークンは出しません。

## デプロイ

- フロント（このアプリ）: `apps/web` を OpenNext で Cloudflare Workers へ
  - `pnpm --filter @adhd-stack/web preview` で Workers ランタイム確認
  - `pnpm --filter @adhd-stack/web deploy` は本番だけ
- バックエンド: Convex は Convex のまま。`npx convex deploy` も本番だけ。開発は `pnpm convex:dev`

本番の Workers には `NEXT_PUBLIC_CONVEX_URL` と `NEXT_PUBLIC_CONVEX_SITE_URL` を入れます。OAuth シークレットは Convex 環境変数です。

## 構成

```
apps/web          Next.js App Router + Beautiful UI + OpenNext
convex            Convex Auth・接続・CodingBackend・チャット・公開
docs              要件の正本と切替手順
design_handoff    移行用 IA 参考
```

`apps/web` の画面仕様は [Paper Studio](design-system/adhd-stack/MASTER.md)。既存の Beautiful UI 部品を再利用しています。品質ツールは ultracite（oxlint / oxfmt）のままです。
