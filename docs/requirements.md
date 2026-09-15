# ADHD Stack 要件（v1+ 正本）

プロダクトオーナー合意の方向。以降の実装・調査・検証は本ファイルを単一の正本とする。
`design_handoff/`・旧モック・現行 `convex/` 実験は証拠や移行用参考であり、本ファイルと矛盾したら本ファイルが勝つ。

対象: **Michito 個人の v1**（マルチテナント SaaS ではない）。ホストは `https://adhd.gawarago.com`。
この PR は **Phase 0（ドキュメント）** のみ。アプリ実装・OAuth 配線・デプロイは後続フェーズ。

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

### 正本: Beautiful UI

長期のビジュアル / UIUX システムは [Beautiful UI](https://www.beautifului.dev/)。AI ネイティブ画面の部品をここから組む。

Phase 1 で最低限マップする部品:

| 部品 | 役割 |
| --- | --- |
| PromptBar | チャット入力（composer） |
| Thinking / ThinkingState | 思考・作業中 |
| ToolChips | ツール呼び出し・差分のチップ |
| Approval Card | 確認待ち |
| Streaming Text / Chat | 本文ストリーム |
| SidebarNav / harness | 左レール・アプリ枠 |
| Task Rows / Loading State | 作成中・公開中の進捗 |

トークンは tahcode と同じく **VS Code Dark Green+** を基準にする（背景 `#121712`、面 `#0c150c`、文字 `#cfd4cf`、アクセント `#1fbf3a` 前後）。ライトは後でもよい。tahcode のトークン実装を証拠に、ADHD Stack のシェルへ写す。

### `design_handoff/` は移行用 IA だけ

`design_handoff/` は画面一覧・ジャーニー・git 用語を隠すコピーの参考。**最終デザインシステムではない。** 緑セリフの手渡しにピクセル一致させない。

手渡しのうち **捨てる話**:

- Google を主ログインにする
- OpenAI / Codex を API キーカードでつなぐ
- Cloudflare Sandbox を主ランタイムにする
- プレビュー / 検証 / 本番の多環境を v1 必須にする

手渡しのうち **残してよい話**（IA だけ）:

- つなぐ → 名前を付けて作る → 作成中 → チャット本体 → 公開して URL
- git 用語を UI に出さない（保存 / 反映 / 変更）
- 切れた接続は接続画面でつなぎ直す

このブランチの緑セリフモックは、上記 IA を確認するための移行用フロントである。Phase 1 で Beautiful UI シェルに置き換える。

---

## 4. 接続

カードは四つだけ: **ChatGPT / GitHub / Cloudflare / Convex**。
足りないカードだけ「接続する」を出す。つながっているものは識別子（メール、@handle、team）と切断を出す。

偽の接続・モックトークン・デモ用の成功状態は禁止。未設定なら「つながっていない」と出し、押せば本物の認可だけを始める。

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
| GitHub | カタログで OAuth が使えるなら OpenConnector。使えなければ現行のカスタム Convex OAuth を interim として ConnectionsPort の裏に残してよい |
| Convex | 同上。Platform OAuth を優先し、現行カスタム実装は interim |
| Cloudflare | Pages 向け OAuth の OpenConnector カバレッジを先に確認する。足りなければ Ownstack 型の CF OAuth を interim にしてよい |

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

v1 UI にバックエンド選択は出さなくてよい。ただしスキーマと公開関数名を `codex*` 固定にしない。

現行の衝突: `workspaces.codexEnvironmentId` や `ensureAdhdRepo("adhd-app")` は Codex / 固定名にベタ書きされている。Phase 3 で `codingEnvironmentId` + backend kind、または backend 専用メタに分ける。

---

## 6. 生成アプリのテンプレート（tahcode 由来）

ユーザーアプリを provision するときの **テンプレートリポジトリは tahcode ベース**。
[tahcode](https://github.com/MichitoSugawara/tahcode) と、手元の参照パターンを正とする。

前提: tahcode にはプレビュー作成と、それに必要な足場が既にある。空のグリーンフィールドテンプレートを新造しない。

テンプレートが持つべきもの（tahcode にあるものを単一ユーザーの生成アプリ向けに削る）:

- Convex + Cloudflare ホスティングの型
- Beautiful UI
- プレビュー / デプロイの導線（tahcode にある範囲）
- チーム向けハーネス（招待、複数テナント、社内ツール群）は載せない

GitHub 上に作るリポジトリ名は、作成画面で付けた名前を使う。`adhd-app` 固定は禁止。

現行の衝突:

- `convex/lib/githubRepo.ts` の `ADHD_REPO_NAME = "adhd-app"`
- `convex/lib/cloudflarePages.ts` の `ADHD_PAGES_PROJECT = "adhd-app"`
- `convex/lib/convexProject.ts` の `ADHD_CONVEX_PROJECT = "adhd-app"`
- `convex/lib/codexCloud.ts` の environment label `"adhd-app"`
- `workspaces.ensure` が名前 `"app"` の行を一人 1 件だけ作る

Phase 3 で、名前付き作成（一人複数アプリ可）に合わせる。

---

## 7. 公開

公開はユーザーの **Cloudflare Pages + Convex**。同じアプリ画面に URL を返す。

v1 は公開パスを一本にする。手渡しのプレビュー / 検証 / 本番は、tahcode テンプレート側で既にタダでできる場合を除き **post-v1**。

既知のギャップ（隠さない）:

- ユーザー Convex デプロイへの **関数プッシュ**は、解けるまで手動または CI のままになり得る。現行 `publishActions` も「プロジェクトと本番デプロイはあるが、このサーバーから関数をバンドルできない」と返している
- Pages は GitHub 連携とデプロイ起動までが先行しやすい。Convex URL と Pages URL は取れても、両方 live とは限らない
- 失敗したら同じ画面に原因を平文で出す。偽の成功 URL は出さない

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

| 画面 | ルート案 | v1 |
| --- | --- | --- |
| ログイン、または最初の接続をセッション開始 | `/` または `/login` | 必須。Google ボタンは置かない |
| 接続 | `/connect` | 必須。4 カード。未接続だけ CTA |
| プロジェクト一覧 / 新規 | `/projects`、新規は名前入力 | 必須。`adhd-app` ハードコードと対立する。名前付き作成を正とする |
| 作成中 | `/p/[app]/creating` など | 必須。GitHub / テンプレート / CodingBackend / Pages / Convex の進捗 |
| アプリ編集（チャット本体） | `/p/[app]` | 必須。PromptBar、思考、ツール、公開 CTA、返ってきた URL |
| 環境（プレビュー / 検証 / 本番） | `/p/[app]/envs` | 任意 / post-v1。多環境がテンプレートでタダなら出してよい |

接続が 4/4 になるまで作成・チャットに進ませない、でよい。切れたら接続画面に戻し、元のアプリへ復帰する。

---

## 10. 段階計画

| Phase | 内容 | 完了の目安 |
| --- | --- | --- |
| **0** | 本ファイルを正本にする（この PR） | オーナーが方向に合意できる |
| **1** | Beautiful UI シェル。ログイン / 接続 / 一覧 / 作成中 / エディタ。モック接続なし。手渡しピクセル一致なし | 画面を辿れる。トークンは Dark Green+ |
| **2** | OpenConnector / ConnectionsPort。4 カードを本物の接続にする。ChatGPT は device OAuth 固定 | Convex に不透明 id だけ残る。UI にゲートウェイ名が出ない |
| **3** | CodingBackend + Codex Cloud の provision / chat。tahcode 由来テンプレートを名前付きで置く | チャットでリポジトリが変わる。公開名が `codex*` 固定でない |
| **4** | 公開。Pages + Convex の URL を同じ画面に返す。関数プッシュのギャップは正直に出す | 偽 URL を出さない |
| **5** | `adhd.gawarago.com` を本番に切り替える | モック Pages を本物に置換 |
| **6** | Origin + Cursor Cloud Agent を第二 CodingBackend にする | UI を書き直さずに差し込める |

Phase 1 は本ファイルがあれば着手してよい。OAuth や Codex 呼び出しは Phase 2–3。

---

## 11. OSS 根拠

| 決めること | 根拠にする OSS | なぜ |
| --- | --- | --- |
| UI システムと Dark Green+ | tahcode、Beautiful UI | tahcode が Beautiful UI + 同系トークンでエージェント画面を成立させている。手渡し緑セリフは IA 参考に落とす |
| 接続の置き場 | OpenConnector（[oomol-lab/open-connector](https://github.com/oomol-lab/open-connector)） | 資格情報はゲートウェイ、アプリは connection id / ラベル / Actions だけ見る。Composio 代替として vault + catalog が既にある |
| コネクタを自作しない | OpenConnector catalog、必要なら Composio / OpenClaw のカタログ | 1,000+ プロバイダを先に materialize する。無いものだけ interim のカスタム OAuth |
| ChatGPT ≠ OC openai | OpenConnector openai（API キー）、Codex device OAuth（tahcode / 現行 `codexDevice`） | カタログの openai はキー接続。Codex Cloud / WHAM は ChatGPT アカウントの device OAuth が必要 |
| GitHub / Convex / CF の interim | 現行 ADHD Stack Convex OAuth、Ownstack の CF OAuth | OC で足りるまで、ConnectionsPort の裏に既存実装を残す。UI は同じ 4 カード |
| CodingBackend の切り方 | t3code の provider 差し替え、Kumo の Codex Cloud 呼び出し | UI を固定し、実行系だけ差し替える。v1 は WHAM、次は Cursor Cloud Agent |
| 生成アプリの足場 | tahcode | プレビュー作成・Convex・CF・Beautiful UI が既にある。空テンプレートを新造しない |
| 公開先 | Ownstack / 現行 `publishActions` | ユーザーの Pages + Convex に出す。関数プッシュ未解決は既知 |

---

## 12. 成功条件（v1）

Michito が `adhd.gawarago.com` を開き、4 つをつなぎ、名前を付けてアプリを作り、チャットし、自分の Cloudflare Pages と Convex の URL を同じ画面で受け取れる。IDE は開かない。偽の接続はない。
