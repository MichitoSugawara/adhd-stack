export const SERVICES = [
  {
    body: "API キーでつなぐ（Codex SDK）",
    cta: "キーを入れる",
    id: "openai",
    label: "OpenAI Codex",
    logo: "/brands/chatgpt.png",
    meta: "sk-…7f2a",
  },
  {
    body: "ソース置き場を自動作成",
    cta: "接続する",
    id: "github",
    label: "GitHub",
    logo: "/brands/github.ico",
    meta: "@MichitoSugawara",
  },
  {
    body: "公開先と実行環境",
    cta: "接続する",
    id: "cloudflare",
    label: "Cloudflare",
    logo: "/brands/cloudflare.ico",
    meta: "michito.cloudflare",
  },
  {
    body: "データベースと関数",
    cta: "接続する",
    id: "convex",
    label: "Convex",
    logo: "/brands/convex.ico",
    meta: "team: gawa",
  },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];
