# ADHD Stack

ChatGPT と GitHub をつないで Codex Cloud 上で書き、Cloudflare Pages と Convex に出す。ホストは `adhd.gawarago.com`。

現在はフロントエンドモックのみ。OAuthやデプロイ処理はまだ接続していない。

- [v1 要件](docs/requirements.md)

## 開発

```sh
pnpm install
pnpm dev
```

品質チェックは `pnpm check`、型チェックは `pnpm typecheck`、本番ビルドは `pnpm build`。
