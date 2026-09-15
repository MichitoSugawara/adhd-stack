# Handoff: ADHD Stack — フロントエンド全画面

> **正本は [docs/requirements.md](../docs/requirements.md)。** この手渡しは移行用の IA / ジャーニー / コピー参考。最終デザインシステムではない。緑セリフへのピクセル一致は不要。Google ログイン・OpenAI API キーカード・Cloudflare Sandbox 主ランタイム・必須の多環境は v1 対象外。

## Overview
ADHD Stack は「何も考えずに始められる開発と公開」。Google でログインし、OpenAI Codex（API キー）・GitHub・Cloudflare・Convex の4つをつなぐと、チャットだけでコードが書き換わり、プレビュー → 検証 → 本番 に反映される。IDE は開かない。git は内部で使うが、UI に git 用語は一切出さない。

対象：`adhd-stack/apps/web`（Next.js App Router、Tailwind v4、`@cloudflare/kumo`、Konsta）。現在の `components/frontend-mock.tsx` を置き換える。

## About the Design Files
この同梱物は **HTML で作ったデザインリファレンス**（見た目と挙動を示すプロトタイプ）であり、そのまま出荷するコードではない。**既存の Next.js/React/Tailwind 環境で、既存のパターン（Kumo コンポーネント、Tailwind トークン）を使って再現する**こと。プロトタイプ内のロジック（`ADHD Stack Prototype.dc.html` の `Component` クラス）は状態遷移の仕様書として読む。

## Fidelity
**High-fidelity**。レイアウト・コピー・状態・遷移・**色**は最終。テーマは緑系で、ライト／ダークの2モード（`ADHD Stack Prototype.dc.html` と `ADHD Stack Redesign.dc.html` の `<style>` 先頭にある `:root,[data-theme=light]{…}` / `[data-theme=dark]{…}` が正のトークン表）。

- ライト：紙 `#f3f5f2`、面 `#e8ece7`、文字 `#1a201a`、アクセント `#0b7d24`（ramp 100–900）、注意 `#c9432a`
- ダーク：VS Code「Dark Green+」準拠。背景 `#121712`、面 `#0c150c`、文字 `#cfd4cf`、アクセント `#1fbf3a`、主ボタン `#077015`（hover `#0ab320`）、区切り線 `#0e9c2d` 40%、注意 `#ef6a5c`
- 実装は CSS 変数を `[data-theme]` で切り替える（Tailwind v4 なら `@theme` に同じ変数名で載せる）。既存 Kumo のオレンジは使わない
- 書体：見出し・本文ともセリフ（Source Serif 4）。コードは等幅
- `.card` `.tag` `.btn` `.seg` `.dialog` `.table` は同梱 `_ds/…/styles.css` の実装を参照して Tailwind/Kumo で再現（Kumo に同等があればそれを使い、色はトークンで上書き）
- 成功状態（接続済み／反映済み／公開中／✓／進捗）はアクセント緑、注意（要確認／失敗／削除）は accent-2

## 用語（必ず守る）
| 内部（git/デプロイ） | UI に出す言葉 |
|---|---|
| branch | プレビュー（環境） |
| commit | 保存ポイント |
| push / deploy | 反映 |
| diff | 変更 |
| revert / reset | この時点に戻す |
| merge (preview→staging) | 検証へ送る |
| merge/deploy (staging→prod) | 本番へ反映 |
| rollback | 前の版に戻す |
| merge conflict | 重なり |
| env var / secret | 鍵と設定 |
| production / staging / preview | 本番 / 検証 / プレビュー |
| version | v12, v13（本番・検証の版番号） |

URL 規則：本番 `adhd.gawarago.com`、検証 `staging.adhd.gawarago.com`、プレビュー `<slug>.preview.adhd.gawarago.com`（slug は名前から自動生成、英数字とハイフン）。

## 実装の順番（提案）
1. **トークンとテーマ切替** — `globals.css` に light/dark 変数、`<html data-theme>`、`localStorage('adhd-stack-theme')`、`prefers-color-scheme` 対応（自動）
2. **画面の骨格** — App Router のルート：`/`（ログイン）`/connect` `/projects` `/p/[project]`（エディタ、`?preview=<slug>&tab=`）`/p/[project]/envs`。モックデータで全画面を出す（Prototype の `INITIAL()` をそのまま seed に）
3. **エディタ** — 3カラム＋ヘッダー＋下パネル。右パネルのタブ（ブラウザ／ソース／変更／履歴／相談）、開閉、ターミナル
4. **認証と接続** — Google（Auth.js 等）、GitHub App、Cloudflare OAuth、Convex OAuth、OpenAI API キー保存
5. **実行環境** — Cloudflare Sandbox（下の実装メモ）、プレビュー URL の iframe
6. **AI** — Codex SDK のストリームをメッセージ型に写像、保存ポイント自動作成
7. **環境操作** — 検証へ送る／本番へ反映／前の版に戻す／重なり解決

## 画面一覧（Screens / Views）

デスクトップ基準幅 1280〜1440、モバイル 390。番号は `ADHD Stack Redesign.dc.html` 内の badge/ラベルと対応。

### A. ログイン — S1 / SM1
- 目的：Google でサインイン
- レイアウト：2カラム `1fr 480px`。左：ブランド＋見出し「何も考えずに、始める。」＋説明＋4サービスのロゴ列。右：`surface` 背景のパネルに「サインイン」見出し・説明・**Googleで続ける**（secondary, block, 48px）・注意書き
- モバイル：縦積み、下部カードにボタン
- 遷移：ボタン → 接続（初回は 0/4）

### B. 接続 — 2a / S2〜S5 / S10 / SM2〜SM4 / SM9
- 目的：4サービスの接続状態を見て、足りないものをつなぐ。切断時の再接続もここ
- レイアウト：上部 `nav`（ブランド／接続／プロジェクト／ユーザー）。本文 `1fr 320px`。左：見出し＋説明、進捗バー（`n/4`、4px）、2×2 のサービスカード。右：「次のステップ」カード（accent-100 背景、CTA「プロジェクトへ進む」は 4/4 まで opacity .45）、ログイン情報、ログアウト
- サービスカード（4種）：ロゴ 32px、状態タグ（接続済み=accent / 未接続=neutral / 接続中…=accent 点滅 / 失敗・期限切れ=accent-2）、名前 20px、説明、下段に識別子（メール/@handle/team）＋操作（接続する / 切断 / やめる / もう一度）。次につなぐべきカードに `outline: 1px accent-300`
- サービス：OpenAI Codex（**API キー入力**。Codex Cloud は第三者から呼べないため）、GitHub（GitHub App OAuth）、Cloudflare（OAuth、Pages＋Sandbox）、Convex（OAuth、チーム選択）
- 状態：0/4 初回（見出し「ようこそ。まず4つをつなぎます。」）／3/4 接続中（OAuth ポップアップ待ち）／失敗（カードと右パネルが accent-2、`access_denied` を平文で、「もう一度」「別のチーム」）／4/4（見出し「4つそろいました。」、CTA 有効）／切断（上部に accent-2 バナー「GitHub のトークンが期限切れです。<project>/<preview> から戻ってきました。つなぎ直すと自動でセッションに戻ります」、CTA は「セッションに戻る」）
- 遷移：4/4 → プロジェクト。切断→再接続成功 → 元のエディタへ自動復帰

### C. プロジェクト一覧 — 2b / 2e
- 上部 nav。見出し＋「＋ 新しいプロジェクト」（primary）。集計カード4枚（作業中／要確認／検証待ち／今週の本番反映）。フィルタ（セグメント：すべて／作業中／要確認 ＋ 検索）。テーブル：プロジェクト／最新のプレビュー／状態タグ／本番URL／更新／「開く →」
- **復帰時（4g）**：一覧の代わりに「おかえりなさい · 最後に見たのは <時刻>」「留守中に、N つ進みました。」＋進捗カード（返事待ち=accent-2 outline／できました=accent）＋「すべてのプロジェクトを見る →」。ユーザーが不在中に状態が変わったプレビューがある時だけ出す

### D. 新しいプロジェクト — S6 / SM5（ダイアログ／ボトムシート）
- 入力は **名前のみ**（＝GitHub リポジトリ名）。「自動で用意されるもの」を4行で列挙（GitHub `owner/name`、実行環境、`name.pages.dev`、Convex `team/name`）。ボタン「やめる」「作ってエディタへ」

### E. プロジェクト作成中 — 4d
- 2カラム。左：「用意しています」＋見出し「<name> をつくっています。」＋5ステップのチェックリスト（✓ 済 / ● 進行中(点滅) / ○ 未）＋「この画面を閉じても進みます。終わったら通知します。」右：カード「待っている間に、最初の指示を書いておけます」textarea＋「予約して始める」
- 完了で自動的にエディタへ（最初のプレビュー「はじめに」が作られている）

### F. エディタ — 3a / 3b / 3c / 4a / 4e / 4h（メイン画面）
- レイアウト 3 カラム `240px 460px 1fr`（1440 基準）。
  - **左サイドバー**（surface）：ブランド／プロジェクト名（▾ で切替）／「環境」見出し：本番 vN・検証 vN／「プレビュー · N」＋一覧（各行：点 6px＋名前＋状態。選択中は accent-100 背景、要確認は accent-2-100）／「＋ 新しいプレビュー」／下部に「今日の AI 利用 xx%」バー＋「← プロジェクト一覧」「接続を管理」
  - **中央チャット**：ヘッダー（プレビュー名 16px 600、URL 12px、状態タグ）／メッセージ列／入力欄（card elev-sm：input＋マイク＋送信/停止）。プロトタイプでは入力欄下に「試す：」チップがあるが**実装しない**
  - **右パネル**：セグメント「画面／ソース／変更 N／履歴」（**既定は画面**）＋「保存ポイントに名前」（secondary）「検証へ送る」（primary、送るものがなければ opacity .45）
- メッセージ種別（中央）
  - user：右寄せ、surface 背景、radius-md、15px
  - thinking：`<details open>` 見出し「考え中 · n秒」、本文イタリック、左に 2px の neutral-200 罫
  - ai：15px/1.65 の本文
  - cmd：card、等幅 12.5px、`$` は accent、✓ と所要秒
  - status：「● 反映しています…」（点滅、neutral-600）
  - changes：card「変更 · Nファイル」＋ファイル行（+n accent-700 / −n accent-2-700）＋「変更を見る →」で右パネルを変更タブへ
  - question（4a）：card elev-md、accent-2-300 outline、kicker「あなたの返事を待っています」、質問 18px、選択肢ボタン（secondary, 左寄せ, 補足 12px）。押すと選択肢が user メッセージになり続行
  - approval（4b）：タグ「確認が必要」、質問 18px、影響範囲の平文、実行コマンド（等幅）、「消す前に保存ポイントを自動で作ります。7日間戻せます」、ボタン「やめる（別の方法を頼む）」「消していい」
  - secret（4e）：kicker「鍵を入れる · プレビュー「X」用」、password input ×N、注意文、「保存して続ける」「あとで」。値はチャットログに残さない
  - limit（4h）：accent-2-100 card、「今日の上限に達しました」「ここまでの作業は保存してあります。」「14:00 に自動で再開」「別の鍵で続ける」
  - published：accent-100 card、URL 24px、「開く」「URLをコピー」
- 右パネル タブ
  - **画面**：surface 面の中央に実機風フレーム 360×640（iframe でプレビュー URL を埋め込む）。上に URL と「最新／反映中…」。反映中は opacity .5。将来：要素クリック→チャットに引用（3b）
  - **ソース**：`220px 1fr` ファイルツリー（変更ファイルに「変更」バッジ）＋コード（等幅 12.5px/1.8、行番号 40px、変更行は accent-100 背景・行番号 accent-700）。読み取り専用、AI 編集中は「AI が編集中」
  - **変更**：左に変更ファイル一覧（選択中 accent-100）＋「元に戻す」、右に unified diff（追加 accent-800/accent-100、削除 accent-2-700/accent-2-100、hunk ヘッダ neutral-500）
  - **履歴**：縦タイムライン（`24px 1fr`）。点の色＝どこにあるか：本番=text、検証=neutral-500、このプレビュー=accent。各項目：タイトル 16px 600／時刻／メタ（Nファイル · +a −d · 反映先）／「この時点に戻す」。現在位置は accent-100 背景。凡例をヘッダー右に
- 保存ポイント：**AI の各ターン終了時に自動作成**。「保存ポイントに名前」は直近の保存ポイントに名前を付けるだけ

### F2. エディタの追加仕様（プロトタイプ最新版が正）
- **ヘッダー行**（サイドバー右、全幅）：左 = `project ／ preview名` ＋状態タグ＋URL。右 = セグメント「ブラウザ／ソース／変更 N／履歴」（右パネルのタブ。閉じていても押せば開く）、ターミナル切替、右パネル開閉、区切り、「保存ポイントに名前」「検証へ送る」
- **右パネル開閉**：閉じるとチャットが `1fr` に広がる（`grid-template-columns` を `.25s` で遷移）。パネル見出しはタブ名＋補足（ブラウザ=URL、履歴=凡例）＋×
- **ソースタブ**：ツリーは全ファイル閲覧可。「編集する」→ テキストエリア（等幅、`white-space:pre`）→「保存して反映」で保存ポイント自動作成・プレビュー反映・変更一覧に「手で編集」。「このファイルについて聞く」は入力欄に質問を流し込む
- **下パネル＝ターミナル**（高さ 220px、ヘッダーに `Cloudflare Sandbox · preview名 · /workspace/project`）：AI が実行したコマンドとその出力を流す。ユーザーも入力可（コマンド実行＋ログ型。フル PTY は前提にしない）。`git …` 入力時は「ここでは git は不要」のヒントを返す
- **ブラウザタブ**：実機風フレームは `max-height:100%; overflow:auto` で、ターミナル展開時に縮んでも切れない
- **カラーモード**：サイドバー下「明／暗／自動」。実装は `data-theme` 属性でトークンを差し替える（dark の値は Prototype の `<style>` 参照）。成功色トークン `--color-ok`（既定 = accent、`successColor=green` で緑）を「接続済み／反映済み／公開中／✓／進捗バー」に使う

### F3. 右パネル追加タブ
- **ブラウザ**：アドレスバー（編集可・Enter で読み込み）＋再読み込み＋「スマホ／PC」切替＋新しいタブで開く。中身は **プレビュー URL の iframe**（`sandbox` 不要、同一プロジェクトのサブドメイン）。AI が反映中は左端の点が accent-2 になり iframe は opacity .5。反映完了で自動リロード（`key` を進める）。スマホ = 360×640・radius-lg、PC = パネル全幅
- **サイドチャット**：作業チャットとは別スレッド。**コードを変えない**（read-only ツールのみの Codex セッション）。回答に「← 左に送る」ボタンが付くことがあり、押すと左の入力欄に指示文が入る（送信はしない）。上部に説明カード（accent-100）

## ターミナル／Cloudflare Sandbox 実装メモ
- **実行環境**：Cloudflare Sandbox（`@cloudflare/sandbox`、Durable Object バック）。プロジェクトごとに 1 サンドボックス、プレビューごとに `/workspace/<project>` 配下のワークツリーを切る（プレビュー＝ブランチ）。`getSandbox(env.Sandbox, projectId)` で取得
- **コマンド実行**：`sandbox.exec(cmd, { stream: true })` の stdout/stderr を SSE で中継し、下パネルに流す。AI（Codex SDK）のツール呼び出しも同じ経路で流すので、ユーザーの手入力と AI の実行が 1 本のログになる。**フル PTY は前提にしない**（対話型エディタは非対応。「コマンド実行＋ログ」型）
- **プレビュー URL**：サンドボックス内で `pnpm dev` を起こし `sandbox.exposePort(3000)` → 返る公開 URL を右パネルの iframe に入れる。名前付き URL（`<slug>.preview.adhd.gawarago.com`）は Worker でこの公開 URL へプロキシ
- **スリープ／復帰**：アイドルでサンドボックスは停止する。復帰に数秒かかるので、ターミナルヘッダーに「起動中…」状態を持つ。復帰時は最後のコマンド履歴（Convex に保存）を再表示
- **git 用語の隠蔽**：ターミナルで `git …` を打ったら実行せず「ここでは git は不要です。保存ポイント・反映は上のボタンから」を返す（プロトタイプ同様）。保存ポイント作成・検証/本番反映は Worker 側が git 操作を行う
- **鍵**：環境スコープの secret は `sandbox.exec` の `env` に注入。ログにはマスク（`sk_test_…` の先頭 8 文字のみ）
- **制限値**（同時実行数、CPU、ディスク、アイドル時間）は変わるので Cloudflare の公式ドキュメントで実装時に確認する

### G. 環境 — 3d / 4c
- nav（プロジェクト／<name>／環境）。見出し＋「＋ 新しいプレビュー」。3列 `1fr 1fr 1fr`：プレビュー（accent 点、「自由に作って壊せる」、カード×N：名前・状態タグ・URL・メタ・「開く」「検証へ送る」／古いものは「削除」）／検証（neutral-500 点、v・「本番より新しい／本番と同じ」・URL・「本番との差 Nファイル」・「差を見る」「本番へ反映」）／本番（text 点、elev-md、v・「公開中」・URL・「開く」「前の版に戻す」＋「本番の履歴」）
- 反映失敗（4c）：上部に accent-2-100 の大カード。**1行目は必ず「本番は vN のまま動いています。」**、原因の平文（AI の説明）、記録の末尾6行（等幅）、ボタン「キーを入れてやり直す」「AI に直させる」「今回はやめる」。右列に「いまの状態」（本番=正常、検証=反映できず）

### H. ダイアログ
- 新しいプレビュー（3e）：名前（URL プレビューをリアルタイム表示）／どこから始める（ラジオ：検証 vN から／本番 vN から／既存プレビューの続きから）／最初の指示（任意）／「作って開く」
- 検証へ送る：kicker「<preview> → 検証」、「staging… が新しい版になります。本番には影響しません。」、含まれる保存ポイント一覧
- 重なり（4f）：kicker accent-2、見出し「「X」と同じ場所を変えています」、左右2枚の等幅カード（検証にあるもの／あなたのプレビュー、変更行 accent-100）、3択ボタン（AI に両方を活かしてまとめてもらう＝おすすめ／自分の変更を優先／検証にあるものを優先）
- 本番へ反映（3f）：kicker「検証 vN → 本番」、「adhd.gawarago.com が vN になります。反映は約20秒。うまくいかなければ「前の版に戻す」で vM にすぐ戻せます。」、含まれる変更、「データについて」accent-100 カード
- 保存ポイントに名前：説明「保存は自動。名前は見つけやすくするため」、input、「付ける」
- OAuth 待ち：ロゴ、「<service> で認可」、「別ウィンドウで…戻ってきます」

### I. モバイル（390）
- 接続 2d／一覧 2e／エディタ 2f・3g：エディタは上部に「← project」「preview ▾」「検証へ」、セグメント「チャット／ソース／画面／履歴」を全幅、入力欄は下固定（44px タップ領域）
- 新規プロジェクト／プレビューはボトムシート（`radius-lg` 上のみ）

## Interactions & Behavior（状態遷移）
```
login ─Google→ connect(0/4) ─各カード「接続する」→ OAuth待ち ─許可→ connected+1 ／ 拒否→ failed(カード赤)
connect(4/4) ─「プロジェクトへ進む」→ projects ─「開く」→ editor
projects ─「＋新しいプロジェクト」→ dialog ─「作ってエディタへ」→ creating(5ステップ) ─完了→ editor(プレビュー「はじめに」)
editor: 送信 → busy: thinking(0.5s) → status(1.1s) → cmd(1.0s) → status「反映しています」(0.8s) → ai + changes, 保存ポイント自動作成, usage +9%
editor ─「検証へ送る」→ dialog(重なりがあれば conflict dialog) → staging+1, preview.state=検証済み, ai メッセージ
envs ─「本番へ反映」→ dialog ─成功→ prod=staging, 本番履歴に追加, published メッセージ ／ 失敗→ deployFailed バナー
envs ─「前の版に戻す」→ prod=前の版
editor(要確認) ─選択肢クリック→ user メッセージ化 → 通常ターン
approval ─「消していい」→ 保存ポイント「削除前」作成 → 実行 ／「やめる」→ AI が代替案
secret ─「保存して続ける」→ 環境スコープで保存 → 続行 ／「あとで」→ 鍵不要部分のみ進める
limit ─「14:00 に自動再開」→ キュー ／「別の鍵で続ける」→ usage リセット
切断検知(任意画面) → connect + banner → 再接続成功 → 元の editor へ自動復帰（未送信入力は保持）
```
- 遷移アニメーション：画面切替 `fadein .25s ease`（opacity 0→1, translateY 6px→0）。メッセージ追加も同じ。点滅は `ticker 1.2〜1.4s ease-in-out infinite`（opacity 1→.35）
- 進捗バー `transition: width .4s ease`
- Enter で送信、busy 中は送信ボタンが停止（■）になる。停止すると「止めました。ここまでの変更は保存ポイントに残っています。」
- チャットは新規メッセージで最下部へ自動スクロール（`scrollTop = scrollHeight`、`scrollIntoView` は使わない）
- トースト：画面下中央、text 背景/bg 文字、2.6 秒
- 無効ボタンは opacity .45（デザインシステムの disabled と同じ）
- ホバー/フォーカス：既存 Kumo の状態を使う。カスタム禁止

## State Management
```ts
type Screen = 'login'|'connect'|'projects'|'creating'|'editor'|'envs'
type ServiceKey = 'openai'|'github'|'cloudflare'|'convex'
type PreviewState = '作業中'|'反映済み'|'要確認'|'検証済み'|'一時停止'|string // string: 「3日前」など経過表示
interface Preview { id; name; slug; state: PreviewState; savepoints: {title; when}[]; conflict: boolean }
interface Message { type: 'user'|'thinking'|'ai'|'cmd'|'status'|'changes'|'question'|'approval'|'secret'|'limit'|'published'; text?; meta?; lines?; files?; options?; note?; cmd? }
state = {
  screen, tab: 'screen'|'source'|'changes'|'history', dialog: null|'oauth'|'newProject'|'newPreview'|'promoteStaging'|'conflict'|'promoteProd'|'savepoint',
  connected: Record<ServiceKey, boolean>, connecting: ServiceKey|null, failed: ServiceKey|null, banner: string,
  returnSummary: boolean, projectName, previews: Preview[], activeId, messages: Message[], draft, busy, voice,
  dirty: boolean /* 直近保存ポイント以降の未反映変更 */, usage: 0..100, staging: number, prod: number, deployFailed: boolean,
  history: {title; when; meta; dot; current}[], prodHistory: {label; when}[]
}
```
- データ取得：プロジェクト／プレビュー／保存ポイント／環境の版は Convex に持つ。チャットは Codex SDK のストリームを SSE で中継し、`thinking / tool(cmd) / file_change / message / ask_user / approval_request / secret_request` イベントを上記 Message 型に写像
- プレビュー＝git ブランチ＋Cloudflare Pages preview deployment＋Convex preview deployment。保存ポイント＝commit（AI ターン毎に自動）。検証へ送る＝staging ブランチへ merge → deploy。本番へ反映＝main へ merge → deploy。前の版に戻す＝直前の deployment を再 promote
- 鍵は環境スコープ（preview/staging/prod）で暗号化保存し、チャットログに値を残さない

## Design Tokens（プロトタイプの値。実装では Kumo に置換）
- 色：bg #f3f2f2 / surface（bg より一段暗い）/ text #201e1d / accent #0088b0（ramp 100–900）/ accent-2 #d6006c / neutral ramp
- タイポ：見出し 36（画面タイトル）・26（ダイアログ）・20（カードタイトル）・16（セクション）／本文 15／補助 13・12／kicker 11px letter-spacing .1em uppercase／コード 12.5px 等幅 line-height 1.8
- 余白：ページ 40px、カード 20–22px、チャット 24px、行間ギャップ 20–22px
- 角丸：radius-sm 2px / md / lg（ボトムシート）
- 影：shadow-sm（フレーム）/ md（本番カード、ダイアログ）/ lg（トースト）
- タップ領域：モバイル 44px 以上

## Assets
- `brands/`：chatgpt.png、github.ico、cloudflare.ico、convex.ico、google.svg（元は `apps/web/public/brands/`）
- アイコン：Phosphor duotone（マイク、送信、停止、矢印）。既存の `@phosphor-icons/react` を使う

## Files
- `ADHD Stack Prototype.dc.html` — 動くプロトタイプ。状態遷移の正。ブラウザで開くと 1440×860 のアプリが動く（上部のツールバーとページ最下部の説明文はプロトタイプ用で実装対象外）
- `ADHD Stack Redesign.dc.html` — 全画面の静止画キャンバス。Turn 4（例外系8画面）→ Turn 3（エディタ＋環境）→ Turn 2（SaaS 版全フロー）→ Turn 1（初期案、参考）
- `Current Mock.dc.html` — 置き換え前のモックの再現（比較用）
- `_ds/` と `support.js` — HTML を開くために必要なランタイム。実装には使わない
