export const SERVICES = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    logo: "/brands/chatgpt.png",
  },
  {
    id: "github",
    label: "GitHub",
    logo: "/brands/github.ico",
  },
  {
    id: "cloudflare",
    label: "Cloudflare",
    logo: "/brands/cloudflare.ico",
  },
  {
    id: "convex",
    label: "Convex",
    logo: "/brands/convex.ico",
  },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export const STATUS_LABELS = {
  connected: "デモ接続",
  connecting: "接続中（デモ）",
  disconnected: "未接続",
} as const;
