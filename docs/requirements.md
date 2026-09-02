# 要件

## アプリ概要

ADHD Stack は、ブラウザだけでアプリを書いて公開する Web アプリ。ホストは `adhd.gawarago.com`。

ChatGPT と GitHub をつなぐと、GitHub 上にリポジトリと Codex Cloud 環境ができる。チャットで指示を出すと、そのクラウド環境がコードを書く。thinking、いまやってること、コマンド、ファイル差分が見える。

Cloudflare と Convex をつなぐと、フロントは Cloudflare Pages、API と DB は Convex に載る。公開 URL が返る。

OAuth は全部本物。デモ接続は無い。IDE は開かない。コードを書くのは Codex Cloud。

## 画面一覧

### 接続

足りないアカウントだけつなぐ。ChatGPT、GitHub、Cloudflare、Convex。接続済みは状態が見える。切れたら再接続できる。

### 作成

アプリ名を入れて作る。GitHub リポジトリと、それに紐づく Codex Cloud 環境ができる。終わったらコンソールへ進む。

### コンソール

会話がメイン。ユーザーと Codex のやり取り、thinking、作業中の表示、コマンドの成否、ファイル差分。ログとファイルはサブ。公開すると Pages と Convex の URL が出る。

## ユーザーストーリー

- アカウントをつないで、名前を入れるだけで、リポジトリと開発環境が欲しい
- チャットで指示を出して、いま何をしているかと、変わったファイルを見たい
- できたアプリを、自分の Cloudflare と Convex に出して、URL を受け取りたい
- 接続が切れたら、同じ画面からつなぎ直したい
- 公開先の名前が既にあっても、失敗で止まらずに載せたい
