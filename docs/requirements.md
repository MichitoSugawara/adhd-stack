# ADHD Stack 要件（v1+ 正本）

プロダクトオーナー合意の方向。以降の実装・調査・検証は本ファイルを単一の正本とする。 `design_handoff/`・旧モック・現行 `convex/` 実験は証拠や移行用参考であり、本ファイルと矛盾したら本ファイルが勝つ。

対象: **Michito 個人の v1**（マルチテナント SaaS ではない）。ホストは `https://adhd.gawarago.com`。Phase 0 で本ファイルを正本にした。Phase 1 の UI は Paper Studio に更新する。Phase 2 は ConnectionsPort と実接続。公開 / デプロイの契約は後続の各節に従う。

---

## 1. プロダクト

Kumo（コードを書く側）と Ownstack（ホストする側）を一つにする。

開く → アカウントをつなぐ → アプリを作る → チャットする → ユーザー自身の Cloudflare Pages と Convex に公開する → URL を受け取る。

IDE は開かない。エディタ GUI を埋め込まない。構成やホスティングをユーザーに考えさせない。

---

## 2. 作業ルール（オーナー）

計画・調査・検証では、他 OSS を根拠として引用する。

> 「X がこれを成立させている。だからこちらは Y にする」

優先して見るもの: [tahcode](https://github.com/MichitoSugawara/tahcode)、[OpenConnector](https://github.com/oomol-lab/open-connector)、t3code、[Beautiful UI](https://www.beautifului.dev/)、Ownstack / Kumo の学び。

丸写しは禁止。根拠を書いてから、個人 v1 に合わせて採る。カタログやプロバイダ定義を自前発明する前に、既存の成功例を materialize（必要な分だけ取り出す）する。

---

## 3. UI

### 正本: Paper Studio

2026-09-17 のオーナー指示で、ライトテーマを前提に画面構造と動線を刷新する。[Beautiful UI](https://www.beautifului.dev/) の既存部品、[Circle](https://github.com/ln-dev7/circle) のナビゲーション、[Kitesurf](https://kitesurf.cloudflare.app/) のブラウザ操作、[OpenTUI](https://github.com/anomalyco/opentui) のフォーカスを意識したキー設計を基にした **Paper Studio** を正とする。参照したファイルと commit、採用範囲は [ui-redesign.md](ui-redesign.md)。

実画面で再利用する部品と構造:

| 部品                     | 役割                                   |
| ------------------------ | -------------------------------------- |
| PromptBar                | 同じタブで下書きを保持するチャット入力 |
| StreamingText            | 実際の返答本文                         |
| TaskRows                 | 実際の作成・思考・ツール実行の状態     |
| SidebarNav / CommandMenu | 見える左ナビ・検索・最近のアプリ       |
| ブラウザプレビュー       | 実 URL、表示幅、再読み込み、外部表示   |

トークンは背景 `#f7f7f5`、面 `#ffffff`、文字 `#262925`、補足 `#62685f`、アクセント `#b84f35`。Inter / Noto Sans JP と Geist Mono を使う。`apps/web/app/beautifui/tokens.css` が値の正本、[MASTER.md](../design-system/adhd-stack/MASTER.md) が画面横断の仕様。デスクトップはサイドバーを常設し、モバイルはメニューとチャット / プレビューの切り替えを使う。

名前とアイデアは同じタブに下書きとして保存する。接続への寄り道で失わず、作成後はアプリごとの未送信 composer へ引き継ぐ。AI への自動送信はしない。バックエンド未設定時は UI プレビューと明示し、実接続・生成・公開の成功を作らない。

### `design_handoff/` は移行用 IA だけ

`design_handoff/` は画面一覧・ジャーニー・git 用語を隠すコピーの参考。**最終デザインシステムではない。** 緑セリフの手渡しにピクセル一致させない。

手渡しのうち **捨てる話**:

- Google を主ログインにする
- OpenAI / Codex を API キーカードでつなぐ
- Cloudflare Sandbox を主ランタイムにする

手渡しのうち **残してよい話**（IA だけ）:

- つなぐ → 名前を付けて作る → 作成中 → チャット本体 → 環境（プレビュー / 検証 / 本番）
- git / リポジトリ / ブランチ / コミット / PR を主 UI に出さない（保存 / 変更 / 反映 / 本番へ出す）
- 切れた接続は接続画面でつなぎ直す
- 環境のプレビュー / 検証 / 本番という区分は維持する。旧 [Claude Design 1795b4d9](https://claude.ai/design/p/1795b4d9-3a03-4aaf-b446-df0d1796f63c) は IA の参考とし、現在の画面構造は Paper Studio に従う。Pages のプレビュー配備が無いあいだは「まだ」と出し、偽の昇格はしない

旧モックや過去の配色・書体指定は現行 UI の仕様に使わない。

---

## 4. 接続

カードは四つだけ: **ChatGPT / GitHub / Cloudflare / Convex**。足りないカードだけ「接続する」を出す。つながっているものは識別子（メール、@handle、team）と切断を出す。まだアプリが無い初回の 4/4 は作成画面へ進む。既存アプリや再接続では作成へ強制しない。

偽の接続・モックトークン・デモ用の成功状態は禁止。接続アプリ未設定なら「設定待ち」として操作を無効にし、利用可能な場合だけ本物の認可を始める。

### OpenConnector を優先する

SaaS 接続と、エージェントが呼ぶ Actions は、カタログが支える範囲で **OpenConnector** を使う。

- トークンとシークレットは OpenConnector ゲートウェイ側に置く（vault）
- Convex が持ってよいのは不透明な connection id、status、表示用ラベルだけ
- UI に OpenConnector / OOMOL / workers.dev / ゲートウェイの文字列を出さない（tahcode と同じ契約）

現行 `convex/connections` は `accessToken` / `refreshToken` を直接持っている。これは移行前の実験であり、Phase 2 で ConnectionsPort の裏に隠す。公開 API や UI が生トークンを扱ってはいけない。

### ConnectionsPort

UI と provision は `ConnectionsPort` だけを見る。実装の差し替えで UI を書き換えない。

| プロバイダ | v1 の方針 |
| --- | --- |
| ChatGPT | **カスタム device OAuth**（Codex 公開クライアント）。OpenConnector の openai プロバイダは API キーのみなので、v1 の ChatGPT 入口にしない |
| GitHub | OpenConnector の oauth2 + 後続の repo actions。未設定なら正直に未接続 |
| Convex | OpenConnector の team OAuth + project actions。未設定なら正直に未接続 |
| Cloudflare | カタログに Pages（`page.*`）が無いので、現行カスタム OAuth（`providers.ts` + `cloudflarePages.ts`）を ConnectionsPort の裏に残す。上流への `cloudflare_pages` 追加は follow-up |

手渡しの「API キーカード」と「Google ログイン」ストーリーは殺す。セッションは `/login` でも、最初の接続（ChatGPT または GitHub）をセッション開始にしてもよい。

ChatGPT の device OAuth の事実（Codex 公開クライアント、user code、Cloud Environments は Plus 以上）は README の現行メモを正とする。シークレットをリポジトリに置かない。

---

## 5. コーディングバックエンド（pluggable）

provision・チャット・状態取得を **CodingBackend** インタフェースの裏に置く。UI はバックエンド実装を直接呼ばない。

```
CodingBackend
  provision(app) -> environment
  chat(app, message) -> stream(thinking | tool | text | diff | question)
  status(app) -> idle | running | error
```

| 世代 | 実装 | 役割 |
| --- | --- | --- |
| v1 | GitHub + Codex Cloud Environment（WHAM） | 最初の実装。現行 `convex/lib/codexCloud.ts` 等を再利用する。これは実装詳細であり、公開 API 名にしない |
| 次 | Origin + Cursor Cloud Agent | 同じ CodingBackend の第二実装。Phase 6 |

v1 UI にバックエンド選択は出さない。既定は Codex。Cursor 経路は `codingBackend` フィールド、`ADHD_CODING_BACKEND`、または `workspaces.setCodingBackend` で切る。手順は [docs/coding-backends.md](coding-backends.md)。両方を安全に選べるまでピッカーは出さない。

現行の衝突: `workspaces.codexEnvironmentId` や `ensureAdhdRepo("adhd-app")` は Codex / 固定名にベタ書きされている。Phase 3 で `codingEnvironmentId` + backend kind、または backend 専用メタに分ける。

---

## 6. 生成アプリのテンプレート（tahcode 由来）

ユーザーアプリを provision するときの **テンプレートリポジトリは tahcode ベース**。 [tahcode](https://github.com/MichitoSugawara/tahcode) と、手元の参照パターンを正とする。

前提: tahcode にはプレビュー作成と、それに必要な足場が既にある。空のグリーンフィールドテンプレートを新造しない。

テンプレートが持つべきもの（tahcode にあるものを単一ユーザーの生成アプリ向けに削る）:

- Convex + Cloudflare ホスティングの型
- Beautiful UI
- プレビュー / デプロイの導線（tahcode にある範囲）
- チーム向けハーネス（招待、複数テナント、社内ツール群）は載せない

GitHub 上に作るリポジトリ名は、作成画面で付けた名前を使う。`adhd-app` 固定は禁止。

現行の衝突:

- `convex/lib/githubRepo.ts` の `ADHD_REPO_NAME = "adhd-app"`（Phase 3 で名前付き作成に置換）
- `convex/lib/cloudflarePages.ts` の `ADHD_PAGES_PROJECT = "adhd-app"`（Phase 3 で slug に置換）
- `convex/lib/convexProject.ts` の `ADHD_CONVEX_PROJECT = "adhd-app"`（Phase 3 で slug に置換）
- `convex/lib/codexCloud.ts` の environment label `"adhd-app"`（Phase 3 で slug に置換）
- `workspaces.ensure` が名前 `"app"` の行を一人 1 件だけ作る（Phase 3 で `listMine` / `createAndProvision` に置換。`ensure` は互換のまま）

Phase 3 で、名前付き作成（一人複数アプリ可）に合わせる。

---

## 7. 公開と環境

公開はユーザーの **Cloudflare Pages + Convex**。同じアプリ画面に URL を返す。

「公開と環境」では **プレビュー / 検証 / 本番** を並べる。作業画面では会話とブラウザプレビューを中心にし、公開設定へ進める。ソース管理の言葉は主操作に出さない。

Pages の `preview_deployment_setting` は切らない。既存の preview 配備は最大 8 件まで読む。無ければ「まだ」。本番 URL と本番反映（既存の Pages デプロイ）は本物としてつなぐ。新しいプレビューの作成、検証への送付、環境間の差を見る、版の戻しは、API が無いあいだ操作できない。公開 API に githubRepoUrl は出さない。会話で取得した変更一覧と、未対応の環境間比較は区別する。画面仕様は [ui-redesign.md](ui-redesign.md)。

既知のギャップ（隠さない）:

- ホストはこのサーバーから関数バンドルを送らない。公開時に `convex.create_deploy_key`（または Management API）で本番デプロイキーを発行し、Cloudflare Pages 本番の `CONVEX_DEPLOY_KEY` とビルドコマンド `npx convex deploy --yes --cmd "npm run build"` まで載せる。関数が載るのはその Pages ビルド成功後。この画面からは完了を待たない
- キー発行や Pages への載せに失敗したら「未実施」と出す。偽の成功は出さない
- Pages デプロイ開始はキー載せのあと。開始したことと live 完了は別
- 失敗したら同じ画面に原因を平文で出す。偽の成功 URL は出さない
- 公開は開いているアプリの slug / workspace id に対して行う。最初の 1 件だけを公開してはいけない

---

## 8. v1 に入れない

- マルチテナント、課金、チーム招待
- Cloudflare Sandbox を主ランタイムにする（手渡しのフィクション）
- ローカル Codex CLI ランナー
- デスクトップ IDE GUI の埋め込み
- Google を主ログインにする
- OpenAI API キーを Codex 接続の物語にする
- 偽接続 / モック OAuth
- 空テンプレートの新造
- 公開 API を Codex 専用名で固定すること

---

## 9. 画面（最小）

| 画面 | ルート | v1 |
| --- | --- | --- |
| 入口 | `/` | 開始とワークスペースへの復帰。Google ボタンは置かない |
| 接続 | `/connect` | 4サービス、device code、認可・待機・失敗、元の作業への復帰 |
| アプリ一覧 | `/projects` | 検索・状態の絞り込み・続きから開く。実アプリを表示 |
| 新規作成 | `/new` | 名前と任意のアイデア。同じタブの下書きを保持 |
| 作成中 | `/p/[slug]/creating` | GitHub / テンプレート / CodingBackend / Pages / Convex の実進捗 |
| グローバルナビ | 共通サイドバー / 検索 | 新規作成・一覧・接続・最近のアプリ。`⌘K` / `Ctrl+K` |
| アプリ編集 | `/p/[slug]` | チャットとブラウザプレビュー。実際の変更がある場合だけ変更一覧 |
| 公開と環境 | `/p/[slug]/envs` | プレビュー / 検証 / 本番。無い環境は「まだ」 |
| 公開設定 | `/p/[slug]/publish` | 開いているアプリの公開先、開始操作、実状態と URL |

接続が 4/4 になるまで実際の作成・チャットを実行しない。新規画面での下書き入力はできる。切れたら接続画面に戻し、元のアプリまたは新規入力へ復帰する。

---

## 10. 段階計画

| Phase | 内容 | 完了の目安 |
| --- | --- | --- |
| **0** | 本ファイルを正本にする | オーナーが方向に合意できる |
| **1** | Paper Studio。入口 / 接続 / 一覧 / 新規 / 作成中 / チャットとプレビュー。既存 Beautiful UI 部品を再利用 | desktop / mobile で辿れる。下書きが続き、偽の成功を出さない |
| **2** | OpenConnector / ConnectionsPort。4 カードを本物の接続にする。ChatGPT は device OAuth 固定 | Convex に不透明 id だけ残る。UI にゲートウェイ名が出ない |
| **3** | CodingBackend + Codex Cloud の provision / chat。tahcode 由来テンプレートを名前付きで置く（この PR） | チャットでリポジトリが変わる。公開名が `codex*` 固定でない |
| **4** | 公開。Pages + Convex の URL を同じ画面に返す。関数プッシュのギャップは正直に出す（この PR） | 偽 URL を出さない。公開は slug 単位 |
| **5** | `adhd.gawarago.com` を本番に切り替える | モック Pages を本物に置換 |
| **6** | Origin + Cursor Cloud Agent を第二 CodingBackend にする（この PR） | UI を書き直さずに差し込める。キー無しは正直エラー |

Phase 4 は公開。Phase 5 はホスト切替（資格情報待ち）。Phase 6 は第二 CodingBackend。手順は [docs/coding-backends.md](coding-backends.md)。

---

## 11. OSS 根拠

| 決めること | 根拠にする OSS | なぜ |
| --- | --- | --- |
| Paper Studio の構造と操作 | Beautiful UI、Circle、Kitesurf、OpenTUI | composer・作業表示、見えるナビ、ブラウザプレビュー、フォーカスを意識したキー設計を適用。具体的な参照は [ui-redesign.md](ui-redesign.md) |
| 接続の置き場 | OpenConnector（[oomol-lab/open-connector](https://github.com/oomol-lab/open-connector)） | 資格情報はゲートウェイ、アプリは connection id / ラベル / Actions だけ見る。Composio 代替として vault + catalog が既にある |
| コネクタを自作しない | OpenConnector catalog、必要なら Composio / OpenClaw のカタログ | 既存カタログの対応を先に確認する。無いものだけ interim のカスタム OAuth |
| ChatGPT ≠ OC openai | OpenConnector openai（API キー）、Codex device OAuth（tahcode / 現行 `codexDevice`） | カタログの openai はキー接続。Codex Cloud / WHAM は ChatGPT アカウントの device OAuth が必要 |
| GitHub / Convex / CF の interim | 現行 ADHD Stack Convex OAuth、Ownstack の CF OAuth | OC で足りるまで、ConnectionsPort の裏に既存実装を残す。UI は同じ 4 カード |
| CodingBackend の切り方 | t3code の provider 差し替え、Kumo の Codex Cloud 呼び出し | UI を固定し、実行系だけ差し替える。v1 は WHAM、次は Cursor Cloud Agent |
| 第二 CodingBackend | [Cloud Agents API](https://cursor.com/docs/cloud-agent/api/endpoints)、[Origin API](https://cursor.com/docs/api/origin)、t3code / tahcode | UI は固定。実行は `POST /v1/agents` と `GET /v1/agents/{id}/runs/{runId}`。Origin は `POST /v1/origin/repos/{ownerSlug}`。公開 API は Origin URL を拒否し得る。キー無しは偽実行しない |
| 生成アプリの足場 | tahcode | プレビュー作成・Convex・CF・Beautiful UI が既にある。空テンプレートを新造しない |
| 公開先 | Ownstack / 現行 `publishActions`、[Convex deploy key](https://docs.convex.dev/management-api/create-deploy-key)、[CONVEX_DEPLOY_KEY](https://docs.convex.dev/cli/deploy-key-types) | ユーザーの Pages + Convex に出す。関数は Pages ビルドの `convex deploy` で載せる。ホストからの直プッシュはしない |

---

## 12. 成功条件（v1）

Michito が `adhd.gawarago.com` を開き、4 つをつなぎ、名前を付けてアプリを作り、チャットし、自分の Cloudflare Pages と Convex の URL を同じ画面で受け取れる。IDE は開かない。偽の接続はない。
