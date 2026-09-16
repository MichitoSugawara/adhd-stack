# 実行系の切り替え（Phase 6）

UI は同じです。差し替えるのは CodingBackend だけです。t3code / tahcode と同じく、ThinkingState / ToolChips に入る正規化イベント `{ thinking, work, command, diff, text, error }` は変えません。

| kind | 実装 | 認証 |
| --- | --- | --- |
| `codex_cloud`（v1 既定） | GitHub + Codex Cloud Environment（WHAM） | ChatGPT デバイスログイン |
| `cursor_cloud` | GitHub + Cursor Cloud Agent。任意で Origin リポジトリ作成 | `CURSOR_API_KEY`（[Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints)）。Origin は `ORIGIN_TOKEN` + `ORIGIN_OWNER_SLUG`（[Origin API](https://cursor.com/docs/api/origin)） |

画面にバックエンド選択は出ません。両方を安全に選べる状態（Cursor キーと ChatGPT が揃い、Origin API が Cloud Agent から Origin URL を受け付ける）になるまで出さない。

## エンジン 2 を有効にする

Convex の環境変数（ダッシュボードまたは `npx convex env set`。開発は `pnpm convex:dev`。シークレットはコミットしない）。

| 変数 | 必須 | 用途 |
| --- | --- | --- |
| `CURSOR_API_KEY` | Cursor 経路 | `https://api.cursor.com/v1` への Basic Auth（`-u KEY:`）。[GET /v1/me](https://cursor.com/docs/cloud-agent/api/endpoints) で検証する |
| `ADHD_CODING_BACKEND=cursor_cloud` | 任意 | 新規作成の既定を Cursor にする。無ければ Codex |
| `ORIGIN_TOKEN` または `CURSOR_ORIGIN_TOKEN` | 任意 | `POST /v1/origin/repos/{ownerSlug}` の Bearer。**Cursor の API キーは Origin の Bearer に使えない** |
| `ORIGIN_OWNER_SLUG` | Origin 作成時 | Origin の owner |

既存アプリは `workspaces.setCodingBackend({ slug, codingBackend: "cursor_cloud" })` のあと、作成中画面で「もう一度試す」。新規だけなら `createAndProvision({ name, codingBackend: "cursor_cloud" })`。

キーが無いときは「Cursor の API キーがありません…偽の実行はしません。」で止まります。成功したように見せません。

## 公式 API（このアダプタが呼ぶもの）

根拠: [Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints)、[Origin API](https://cursor.com/docs/api/origin)、[Origin × Cloud agents](https://cursor.com/docs/origin/integrations)。

| 操作 | 呼び出し |
| --- | --- |
| キー確認 | `GET https://api.cursor.com/v1/me`（Basic `-u CURSOR_API_KEY:`） |
| Origin 作成（任意） | `POST /v1/origin/repos/{ownerSlug}` `{ name, defaultBranch: "main" }` Bearer `ORIGIN_TOKEN` |
| 初回ターン | `POST /v1/agents` `{ prompt.text, repos[{ url, startingRef: "main" }], autoCreatePR: false }` |
| 続き | `POST /v1/agents/{bc-…}/runs` `{ prompt.text }` |
| 進捗 | `GET /v1/agents/{id}/runs/{runId}` → `status` / `result` / `git.branches` |

`GET .../runs/{runId}/stream` には `thinking` / `tool_call` がある。v1 の poll 経路は Codex と同じく GET だけなので、thinking / command は空のままにする。偽の思考は出さない。

ダッシュボード上の Cloud Agent は Origin リポジトリを扱えます。公開 `POST /v1/agents` は Origin URL を `repository_access` で拒否することがあります。こちらは Origin リポジトリを作れたら `originRepoUrl` に保存し、実行は GitHub URL で始めます。
