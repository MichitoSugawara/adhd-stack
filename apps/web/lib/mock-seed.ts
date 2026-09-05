import type {
  AppState,
  Connections,
  Message,
  Preview,
  Project,
} from "./mock-types";

export const emptyConnections = (): Connections => ({
  cloudflare: { identity: "未選択", status: "disconnected" },
  convex: { identity: "未選択", status: "disconnected" },
  github: { identity: "未選択", status: "disconnected" },
  openai: { identity: "未選択", status: "disconnected" },
});

export const CREATE_STEPS = [
  "作業場を用意",
  "プレビューを開く",
  "公開先を用意",
  "データを用意",
  "会話の準備",
] as const;

const shopChanges = [
  {
    file: "apps/web/app/page.tsx",
    lines: [
      { kind: "ctx" as const, text: "export default function Page() {" },
      { kind: "del" as const, text: "  return <main>準備中</main>" },
      { kind: "add" as const, text: "  return <main>予約する</main>" },
      { kind: "ctx" as const, text: "}" },
    ],
  },
  {
    file: "apps/web/components/hero.tsx",
    lines: [
      { kind: "add" as const, text: "export const Hero = () => (" },
      { kind: "add" as const, text: "  <h1>今日の席を取る</h1>" },
      { kind: "add" as const, text: ")" },
    ],
  },
];

const shopMessages: Message[] = [
  {
    body: "予約の画面を作って。名前と人数と日時。",
    id: "m1",
    kind: "user",
  },
  {
    body: "席の取り方を組み立てています。",
    id: "m2",
    kind: "thinking",
  },
  {
    body: "画面の土台を書いています。",
    id: "m3",
    kind: "cmd",
    meta: { command: "pnpm check" },
  },
  {
    body: "予約フォームと見出しを足しました。",
    id: "m4",
    kind: "changes",
    meta: { additions: 18, deletions: 2, files: shopChanges },
  },
  {
    body: "営業時間の外は受けますか？",
    id: "m5",
    kind: "question",
    meta: { options: ["受けない", "翌日に回す"] },
  },
  {
    body: "検証版へ送ってよいですか？",
    id: "m6",
    kind: "approval",
  },
  {
    body: "支払いの鍵が足りません。",
    id: "m7",
    kind: "secret",
  },
  {
    body: "今月の会話回数に近づいています。",
    id: "m8",
    kind: "limit",
  },
  {
    body: "本番に出しました。",
    id: "m9",
    kind: "published",
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    creatingStep: 5,
    id: "yoyaku",
    lastTalk: "予約の画面を作って",
    liveUrl: "https://yoyaku-demo.pages.dev",
    name: "お店の予約",
    reservedPrompt: "",
    status: "ready",
  },
  {
    creatingStep: 2,
    id: "portal",
    lastTalk: "まだ会話なし",
    liveUrl: "",
    name: "社内ポータル",
    reservedPrompt: "お知らせと休暇届",
    status: "creating",
  },
];

export const INITIAL_PREVIEWS: Preview[] = [
  {
    id: "yoyaku-draft",
    kind: "draft",
    projectId: "yoyaku",
    title: "予約フォーム",
    url: "https://yoyaku-draft.pages.dev",
  },
  {
    id: "yoyaku-review",
    kind: "review",
    projectId: "yoyaku",
    title: "検証版",
    url: "https://yoyaku-review.pages.dev",
  },
  {
    id: "yoyaku-live",
    kind: "live",
    projectId: "yoyaku",
    title: "本番",
    url: "https://yoyaku-demo.pages.dev",
  },
];

export const emptyState = (): AppState => ({
  banner: null,
  connections: emptyConnections(),
  history: [],
  messages: {},
  openaiKey: "",
  overlap: null,
  previews: [],
  projects: [],
  reservedPrompt: "",
  secrets: [],
  session: null,
  terminal: [],
});

export const initialState = (): AppState => ({
  banner: null,
  connections: emptyConnections(),
  history: [
    { id: "h1", title: "予約フォームを保存", when: "今日 11:20" },
    { id: "h2", title: "見出しを保存", when: "今日 11:08" },
  ],
  messages: { yoyaku: shopMessages },
  openaiKey: "",
  overlap: null,
  previews: INITIAL_PREVIEWS,
  projects: INITIAL_PROJECTS,
  reservedPrompt: "",
  secrets: [
    { key: "STRIPE_SECRET", lane: "review", value: "••••••" },
    { key: "STRIPE_SECRET", lane: "live", value: "••••••" },
  ],
  session: null,
  terminal: [
    { text: "pnpm check", tone: "plain" },
    { text: "ok  42", tone: "ok" },
  ],
});
