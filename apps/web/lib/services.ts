export const SERVICES = [
  {
    category: "会話",
    hint: "APIキーを入れる",
    id: "openai",
    label: "OpenAI Codex",
    logo: "/brands/chatgpt.png",
  },
  {
    category: "ソース",
    hint: "つなぐだけ",
    id: "github",
    label: "GitHub",
    logo: "/brands/github.ico",
  },
  {
    category: "公開",
    hint: "つなぐだけ",
    id: "cloudflare",
    label: "Cloudflare",
    logo: "/brands/cloudflare.ico",
  },
  {
    category: "データ",
    hint: "つなぐだけ",
    id: "convex",
    label: "Convex",
    logo: "/brands/convex.ico",
  },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];
