export const SERVICES = [
  {
    body: "画面のコードを ChatGPT に入れます。",
    id: "chatgpt",
    label: "ChatGPT",
    logo: "/brands/chatgpt.png",
  },
  {
    body: "作ったアプリを保管します。",
    id: "github",
    label: "GitHub",
    logo: "/brands/github.ico",
  },
  {
    body: "ページの公開先です。",
    id: "cloudflare",
    label: "Cloudflare",
    logo: "/brands/cloudflare.ico",
  },
  {
    body: "データと関数の置き場です。",
    id: "convex",
    label: "Convex",
    logo: "/brands/convex.ico",
  },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];
