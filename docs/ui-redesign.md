# Paper Studio — UI と動線の刷新

2026-09-17。ライトテーマを基準に、開始・接続・作成・会話・プレビュー・公開を組み直す。バックエンド、OAuth、CodingBackend、公開先の契約は [requirements.md](requirements.md) を維持する。

## デザイン

暖かい紙色 `#f7f7f5` に白 `#ffffff` の作業面。文字は `#262925`、補足は `#62685f`、アクセントはテラコッタ `#b84f35`。Inter / Noto Sans JP を本文と見出しに、Geist Mono をコードとキー表示に使う。実装値は `apps/web/app/beautifui/tokens.css`、画面横断の仕様は [MASTER.md](../design-system/adhd-stack/MASTER.md) が正本。

## 参照元と適用

| 参照 | 確認した内容 | このアプリでの適用 |
| --- | --- | --- |
| [Beautiful UI](https://www.beautifului.dev/) | AI 向け composer、本文、作業状態の部品 | 既存 `PromptBar` / `StreamingText` / `TaskRows` を再利用。実データを渡し、デモ動作を無効化 |
| [Circle app-sidebar](https://github.com/ln-dev7/circle/blob/b0ba7ddcc3d0f4c16092236ca6a01b56c0614810/components/layout/sidebar/app-sidebar.tsx) / [nav-workspace](https://github.com/ln-dev7/circle/blob/b0ba7ddcc3d0f4c16092236ca6a01b56c0614810/components/layout/sidebar/nav-workspace.tsx) | 見える階層ナビゲーション、固定 footer、モバイル展開 | 作成・一覧・接続を常設し、最近のアプリを下段にまとめる |
| [Circle command palette](https://github.com/ln-dev7/circle/blob/b0ba7ddcc3d0f4c16092236ca6a01b56c0614810/components/layout/command-palette.tsx) / [projects-list](https://github.com/ln-dev7/circle/blob/b0ba7ddcc3d0f4c16092236ca6a01b56c0614810/components/common/projects/projects-list.tsx) | 検索からの移動、キー表示、一覧の情報階層 | `⌘K` / `Ctrl+K` とアプリ検索、状態と次の操作が読める一覧 |
| [Kitesurf](https://kitesurf.cloudflare.app/) / [Browser Run](https://developers.cloudflare.com/browser-run/kitesurf/) | URL バーと結果操作、エージェント向けブラウザ | エディタのブラウザは Cloudflare Browser Run の Quick Action（`browser=kitesurf`）で描画する。接続や権限が無いときは再接続を出し、iframe だけの成功表示はしない |
| [OpenTUI keymap](https://github.com/anomalyco/opentui/blob/871119e9e4f317bfd422f6753d557722855f27ac/packages/keymap/README.md) / [HTML demo](https://github.com/anomalyco/opentui/blob/871119e9e4f317bfd422f6753d557722855f27ac/packages/web/src/pages/demos/keymap-html/index.astro) | フォーカス単位のキー処理、状態の明示 | dialog 内の操作、IME を妨げない入力、控えめな状態行。terminal runtime は追加しない |

Circle は commit `b0ba7ddcc3d0f4c16092236ca6a01b56c0614810`、OpenTUI は `871119e9e4f317bfd422f6753d557722855f27ac` を参照。Beautiful UI / Kitesurf は 2026-09-17 の公開ページを確認した。

今回 Circle / OpenTUI / Kitesurf のコードは直接取り込まず、構造と操作パターンを Web アプリに合わせて実装した。Circle と OpenTUI の参照元はそれぞれ [MIT](https://github.com/ln-dev7/circle/blob/b0ba7ddcc3d0f4c16092236ca6a01b56c0614810/LICENSE.md)、[MIT](https://github.com/anomalyco/opentui/blob/871119e9e4f317bfd422f6753d557722855f27ac/LICENSE)。既存の Beautiful UI 部品とそのライセンス・帰属は保持する。

## 画面と動線

| 画面 | ルート | 主な操作 |
| --- | --- | --- |
| 入口 | `/` | サービスを理解し、開始する。利用中なら一覧へ戻る |
| 接続 | `/connect` | 4サービスの認可、コードのコピー、再接続、元の作業へ復帰 |
| アプリ一覧 | `/projects` | 実アプリを検索・絞り込みし、続きから開く |
| 新しいアプリ | `/new` | 名前と任意のアイデアを入力。例は下書きへ入る |
| 準備中 | `/p/[slug]/creating` | 実際の準備状態、失敗理由、再試行、作業画面への移動 |
| 作業画面 | `/p/[slug]` | チャット、未送信下書き、実 URL のプレビュー、取得した変更の確認 |
| 公開と環境 | `/p/[slug]/envs` | プレビュー・検証・本番の状態と利用できる操作を確認 |
| 公開設定 | `/p/[slug]/publish` | 対象アプリの公開を開始し、返却状態と URL を確認 |

新規入力は同じタブの `sessionStorage` に保存し、接続の寄り道から戻しても続けられる。作成に成功したらアイデアを slug ごとのチャット下書きへ引き継ぐ。AI への送信はユーザー操作で行い、成功が確認されるまで下書きを残す。下書きはサーバー保存や別端末同期ではない。

desktop はサイドバー + 作業画面、mobile はメニュー dialog + チャット / プレビュー切替。検索には現在アクセスできる実アプリを使う。接続数、公開状態、変更件数をサンプル値で埋めない。

## 状態の約束

- `ConnectionsPort` / `CodingBackend` / 公開処理の実際の状態を表示する。取得前は確認中、未対応は未対応と示す。
- バックエンド未設定時は「UI プレビュー」。ブラウザ内の画面用データから実接続・生成・公開の成功を作らない。
- 公開要求の受付、ビルド中、公開成功を分ける。存在しないプレビュー URL や検証環境を表示しない。
- キーボード操作、native dialog のフォーカス、IME、読み上げ名、reduced motion を確認対象に含める。

## 検証記録

2026-09-17、ローカルの UI プレビューモードで実施。

- [x] `pnpm check`: lint / format、警告なし
- [x] `pnpm typecheck`: Web / Convex の型チェックと13本の検証スクリプト
- [x] `pnpm build`: Next.js 本番ビルド
- [x] 本番ビルドを `next start` で起動し、8ルートがHTTP 200。最終巡回でブラウザ実行時エラー・console errorなし
- [x] `git diff --check`
- [x] Chrome で開始 → 接続 → 新規入力 → 準備手順 → 編集、一覧・環境・公開への画面遷移
- [x] 一覧の検索・該当なし・リスト表示、サイドバーの折りたたみ、モバイルメニュー
- [x] 8画面 × 320 / 390 / 768 / 1024 / 1440px の40条件で横はみ出しなし
- [x] 390×844 のチャット / プレビュー切替、⌘K検索・矢印選択・Enter移動・Escのフォーカス復帰、IME変換中のキーイベントを妨げないこと
- [x] 新規下書き → 接続への寄り道 → 入力復元 → composer の未送信下書きへの引き継ぎ
- [x] `assert-ui-drafts.mjs`: 保存・復元・別タブ・不正データ・ストレージ制限・slug別保持・接続後の戻り先の許可リスト
- [x] 送信処理の局所実行で成功 / 失敗 / より新しい下書きとの競合を確認。遅延した作成完了後の画面遷移、セッション切れ時の一覧、公開準備未完了時の戻り先もソースレビューして修正

画面証跡は `output/playwright/`（Git管理外）に保存。`welcome-final.png`、`create-final.png`、`editor-final.png`、`editor-mobile-chat.png`、`editor-mobile-preview.png`、`projects-desktop-list.png`、`environments-desktop.png`、`publish-desktop.png`。

未設定・未接続・空状態・実行待ちはブラウザで確認した。認証後の実データ、接続失敗、生成や公開の成功 / 失敗についてはライブ環境での検証が残る。バックエンド未設定の状態を成功表示に置き換えてはいない。

ローカル確認は実 OAuth、AI による生成、ユーザーアカウントへの公開、本番デプロイの完了を証明しない。この文書では、それらのライブ確認や本番反映を完了としていない。
