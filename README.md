# ADHD Stack

何も考えずに始められる開発と公開。ホストは `adhd.gawarago.com`。

開いたらヒーローの下に、つなぐものが4つ並ぶ。ChatGPT、GitHub、Cloudflare、Convex。全部つながったらエディタへ進む。チャットが本体で、IDE は開かない。

## いまの状態

このリポジトリは Turborepo の `apps/web`（Next.js App Router）と、ルートの `convex/`（Convex バックエンド）です。ADHD Stack 本体は OpenNext（`@opennextjs/cloudflare`）で Cloudflare Workers に出し、データとリアルタイムは Convex に置きます。

現在公開中の [https://adhd.gawarago.com](https://adhd.gawarago.com) は静的 Pages のフロントモックです。ボタンは見た目だけで、OAuth も Convex もつながっていません。このコードは本物の第三者ログインと Convex を配線しています。GitHub / Cloudflare / Convex は OAuth アプリの Client ID / Secret が必要です。ChatGPT は Codex のデバイスログインなので、OpenAI の OAuth アプリは不要です。このリポジトリにシークレットは入れていません。

要件は [docs/requirements.md](docs/requirements.md) です。

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

GitHub / Cloudflare / Convex のログインはモックではありません。各サービスのダッシュボードで OAuth アプリを作り、Client ID / Secret を **Convex の環境変数** に入れてください。値はコミットしないでください。ChatGPT は Codex CLI と同じデバイスログインなので、OpenAI の OAuth アプリも `CHATGPT_CLIENT_*` も不要です。

GitHub / Cloudflare / Convex のコールバック URL は Convex の HTTP Actions です。デプロイ URL の `.cloud` を `.site` にした origin を使います。

| サービス | 作る場所 | コールバック | Convex 環境変数 |
| --- | --- | --- | --- |
| ChatGPT | 不要（Codex デバイスログイン） | なし。`https://auth.openai.com/codex/device` にコードを入力 | なし |
| GitHub | GitHub → Settings → Developer settings → OAuth Apps | `https://<deployment>.convex.site/oauth/callback/github` | `GITHUB_CLIENT_ID` `GITHUB_CLIENT_SECRET` |
| Cloudflare | Cloudflare → Manage Account → OAuth clients | `https://<deployment>.convex.site/oauth/callback/cloudflare` | `CLOUDFLARE_CLIENT_ID` `CLOUDFLARE_CLIENT_SECRET` |
| Convex | Convex → Team Settings → OAuth applications（team scope） | `https://<deployment>.convex.site/oauth/callback/convex` | `CONVEX_OAUTH_CLIENT_ID` `CONVEX_OAUTH_CLIENT_SECRET` |

フロントの `NEXT_PUBLIC_CONVEX_URL` と `NEXT_PUBLIC_CONVEX_SITE_URL` は公開してよいデプロイ URL です。シークレットは Convex 側だけに置きます。

### ChatGPT

- Codex CLI と同じデバイスログインです。OpenAI の Sign-in-with-ChatGPT アプリは作りません。
- 公開クライアント ID は Codex CLI の `app_EMoamEEZ73f0CkXaXp7hrann` です。シークレットではありません。
- ユーザーコード発行: `https://auth.openai.com/api/accounts/deviceauth/usercode`
- 入力ページ: `https://auth.openai.com/codex/device`
- ポーリング: `https://auth.openai.com/api/accounts/deviceauth/token`
- トークン交換: `https://auth.openai.com/oauth/token`（`redirect_uri` は `https://auth.openai.com/deviceauth/callback`）
- Cloud Environments / Codex Cloud は Plus 以上が必要です。Free と Go では足りません。
- GitHub リポジトリと Cloudflare Pages / Convex プロジェクトは、つながったトークンで用意を試みます。Codex Cloud 環境の公開 API が使えるようになったら同じ経路で足します。偽の環境は作りません。

### GitHub

- [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)
- スコープ: `repo` `read:user` `user:email`
- リポジトリのホストです。接続後、アカウント側に作業用リポジトリを用意します。

### Cloudflare

- [Create your OAuth client](https://developers.cloudflare.com/fundamentals/oauth/create-an-oauth-client/)
- 認可: `https://dash.cloudflare.com/oauth2/auth`
- トークン: `https://dash.cloudflare.com/oauth2/token`
- ユーザーアプリのフロントは、つながったアカウントの Cloudflare Pages に出します。
- 新規クライアントは private です。他人のアカウントでも使うなら public 化とドメイン確認が必要です。

### Convex

- [OAuth Applications](https://docs.convex.dev/platform-apis/oauth-applications)
- 認可: `https://dashboard.convex.dev/oauth/authorize/team`
- トークン: `https://api.convex.dev/oauth/token`
- ユーザーアプリの API / DB は、つながったアカウントの Convex に出します。

アプリ未設定のノードは「OAuth アプリ未設定」と出ます。押すとエラーになり、偽のトークンは出しません。

## デプロイ

- フロント（このアプリ）: `apps/web` を OpenNext で Cloudflare Workers へ
  - `pnpm --filter @adhd-stack/web preview` で Workers ランタイム確認
  - `pnpm --filter @adhd-stack/web deploy` は本番だけ
- バックエンド: Convex は Convex のまま。`npx convex deploy` も本番だけ。開発は `pnpm convex:dev`

本番の Workers には `NEXT_PUBLIC_CONVEX_URL` と `NEXT_PUBLIC_CONVEX_SITE_URL` を入れます。OAuth シークレットは Convex 環境変数です。

## 構成

```
apps/web          Next.js App Router + OpenNext
convex            Convex Auth・接続・チャット
.cursor/skills    ui-ux-pro-max
design-system     スキルが出したデザイン方針
```

`apps/web` のモック画面（接続ノード UI / エディタ）を残し、偽の接続状態を本物の OAuth に差し替えています。プロジェクト一覧は補助画面です。品質ツールは ultracite（oxlint / oxfmt）のままです。
