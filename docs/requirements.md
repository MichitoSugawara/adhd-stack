# ADHD Stack v1 要件（下書き）

日付: 2026-09-02
置き場: https://github.com/MichitoSugawara/adhd-stack （`docs/requirements.md`）
ホスト: adhd.gawarago.com

## 何を作るか

Web でアカウントをつないだら、コードを書いて、自分の Cloudflare と Convex に載せる。IDE を開かない。

Kumo が開発（ChatGPT + GitHub + Codex Cloud）。Ownstack が公開（Cloudflare Pages + Convex）。ADHD Stack はその二つを一つの流れにする。別プロダクトを行き来しない。

v1 の利用者は自分（道人）。他人向け SaaS はまだやらない。OAuth は全部本物。デモ接続は入れない。

## ユーザーがやること

1. adhd.gawarago.com を開く
2. ChatGPT / GitHub / Cloudflare / Convex を接続する（未接続だけボタンが出る）
3. アプリ名を入れて「作る」。GitHub にリポが出来て、Codex Cloud 環境がそれに紐づく
4. チャットで指示する。thinking、今やってること、コマンド、ファイル差分が出る（ChatGPT Codex の画面に寄せる。UI は assistant-ui）
5. 「公開する」でフロントが自分の Cloudflare Pages、バックエンドと DB が自分の Convex に載る。URL が返る

## v1 でやる

- 四つのアカウント接続。切れたら再接続。モック経路なし
- リポ作成（GitHub、ユーザーの個人アカウント）
- Codex Cloud 環境作成（WHAM。machine_id は universal。repos は github-{id}。ユーザー文をアシスタント扱いにしない）
- 会話コンソール。タスクごとに本物の Codex 返答。429 は一時障害として待つ
- 公開。既存 Pages 名がぶつかったら再利用か別名（Ownstack で踏んだ）
- ホストは adhd.gawarago.com。Kumo の named tunnel と同じ Cloudflare ゾーン

## v1 でやらない

- t3code 本体の埋め込み（デスクトップ GUI なのでチャット部品にしない）
- ローカル Codex CLI / ローカル runner
- マルチテナント、課金、チーム招待
- GitHub 以外の Git、Vercel、Supabase
- 自分の ChatGPT アプリを新規発行する（Codex 公開クライアントの device フローを使う）
- 自動 PR マージ、本番カスタムドメインの自動 DNS（公開 URL は pages.dev と convex.site で足りる）

## 画面

- /connect … 四つの接続状態。欠けてるものだけつなぐ
- /new … 名前と一言。リポ + 環境
- /app/:id … 会話がメイン。ログ・差分・ファイルはサブ。公開ボタン
- 公開後はそのアプリの本番 URL を同じ画面に出す

## 今日までの制約（POC で踏んだ）

- ChatGPT は device OAuth。callback を kumo.gawarago.com にすると公開クライアントの allowlist に無い
- 環境作成は machine_id と repos が必須。repos は owner/name オブジェクトではなく github-{numericId}
- タスク GET の 429 を失敗扱いにすると会話が死ぬ
- ユーザーの input_items をアシスタント本文にするとオウム返しになる
- Ownstack の post-callback で bind アドレス 0.0.0.0 を redirect に使うと接続拒否になる。baseUrl を使う
- Pages 名 ownstack-notes は既存衝突。再利用する
- Origin の新規 VM は、Kumo と Ownstack エージェントが動いてると起動前に落ちることがある

## 置いた前提（違うなら直して）

1. v1 は自分用。GitHub は MichitoSugawara、Convex は team gawa、Cloudflare は michitogawara
2. チャットは Codex Cloud に投げる。こちらの LLM でコードを書かない
3. フロントは Cloudflare Pages、API/DB は Convex。Kumo 制御面のホストは ADHD 側（adhd.gawarago.com）に寄せる。kumo.gawarago.com は POC のまま残してよい
