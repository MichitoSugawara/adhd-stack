export const SERVICES = [
  {
    body: "画面のコードを ChatGPT に入れます。",
    id: "chatgpt",
    label: "ChatGPT",
    logo: "/brands/chatgpt.png",
  },
  {
    body: "ソースの置き場です。",
    id: "github",
    label: "GitHub",
    logo: "/brands/github.ico",
  },
  {
    body: "公開先の Pages です。",
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
