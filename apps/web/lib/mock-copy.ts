import type { MockDiffHunk } from "./mock-types";
import type { ServiceId } from "./services";

export const DEMO_BADGE = "デモモード";
export const MOCK_LABEL = "モックデータ";

export const MOCK_IDENTITIES = {
  chatgpt: "デモユーザー",
  cloudflare: "demo-pages",
  convex: "demo-team",
  github: "@demo-michito",
} as const satisfies Record<ServiceId, string>;

export const SERVICE_META = {
  chatgpt: {
    lastCheck: "デモ確認のみ",
    permission: "会話 / タスク（デモ）",
    target: "Codex 環境（モック）",
  },
  cloudflare: {
    lastCheck: "デモ確認のみ",
    permission: "Pages 読み書き（デモ）",
    target: "adhd-app-demo.pages.dev",
  },
  convex: {
    lastCheck: "デモ確認のみ",
    permission: "プロジェクト（デモ）",
    target: "demo-adhd-app",
  },
  github: {
    lastCheck: "デモ確認のみ",
    permission: "repo / user:email（デモ）",
    target: "MichitoSugawara/adhd-app",
  },
} as const satisfies Record<
  ServiceId,
  { lastCheck: string; permission: string; target: string }
>;

export const PROMPT_CHIPS = [
  "ログイン画面を作って",
  "公開ボタンを緑にして",
  "390pxでも切れないようにして",
] as const;

export const MOCK_FILES = [
  "apps/web/app/page.tsx",
  "apps/web/app/globals.css",
  "apps/web/components/hero.tsx",
] as const;

export const MOCK_DIFF_HUNKS: MockDiffHunk[] = [
  {
    file: "apps/web/app/page.tsx",
    lines: [
      { kind: "ctx", text: "export default function Page() {" },
      { kind: "del", text: "  return <main>準備中</main>" },
      { kind: "add", text: "  return <main>ADHD Stack</main>" },
      { kind: "ctx", text: "}" },
    ],
  },
  {
    file: "apps/web/app/globals.css",
    lines: [
      { kind: "ctx", text: ":root {" },
      { kind: "del", text: "  --accent: #64748b;" },
      { kind: "add", text: "  --accent: #22c55e;" },
      { kind: "ctx", text: "}" },
    ],
  },
  {
    file: "apps/web/components/hero.tsx",
    lines: [
      { kind: "add", text: "export const Hero = () => (" },
      { kind: "add", text: "  <h1>何も考えずに、始める。</h1>" },
      { kind: "add", text: ")" },
    ],
  },
];

export const PROJECT_ACTIVITY = [
  {
    detail: "4つのデモ接続をそろえた",
    id: "connect",
    time: "たった今",
  },
  {
    detail: "モックの MichitoSugawara/adhd-app を用意した",
    id: "repo",
    time: "デモ",
  },
  {
    detail: "Codex 環境 env_demo_adhd_app を表示した",
    id: "env",
    time: "デモ",
  },
] as const;

export const STAGE_STRIP = [
  "CONNECT",
  "PROVISION",
  "WORK",
  "DIFF",
  "PUBLISH",
] as const;

export const MOCK_REPO = {
  envId: "env_demo_adhd_app",
  fullName: "MichitoSugawara/adhd-app",
  name: "adhd-app",
  owner: "MichitoSugawara",
  pagesUrl: "https://adhd-app-demo.pages.dev",
  project: "demo-adhd-app",
  url: "github.com/MichitoSugawara/adhd-app",
} as const;
