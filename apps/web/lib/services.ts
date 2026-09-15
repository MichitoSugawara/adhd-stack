export const SERVICES = [
  {
    body: "Codex Cloud 用のデバイスログイン。画面のコードを入力します。",
    id: "chatgpt",
    label: "ChatGPT",
    logo: "/brands/chatgpt.png",
  },
  {
    body: "ソース置き場。リポジトリは名前を付けて作る。",
    id: "github",
    label: "GitHub",
    logo: "/brands/github.ico",
  },
  {
    body: "ユーザーの Cloudflare Pages へ公開する。",
    id: "cloudflare",
    label: "Cloudflare",
    logo: "/brands/cloudflare.ico",
  },
  {
    body: "ユーザーの Convex にデータと関数を置く。",
    id: "convex",
    label: "Convex",
    logo: "/brands/convex.ico",
  },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];
