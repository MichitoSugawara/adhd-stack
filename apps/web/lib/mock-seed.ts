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
    body: "タスク一覧をモバイルで見やすくして。完了したものは下に。",
    id: "m1",
    kind: "user",
  },
  {
    body: "page.tsx の一覧を done で2つに分け、完了側は薄く。CSS は1ファイルで足りる。",
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
    body: "一覧を「今日やること」と「完了」に分けました。",
    id: "m4",
    kind: "changes",
    meta: { additions: 27, deletions: 6, files: shopChanges },
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
    id: "task-board",
    lastTalk: "タスク一覧をモバイルで",
    liveUrl: "https://adhd.gawarago.com",
    name: "task-board",
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
    id: "mobile",
    kind: "draft",
    projectId: "task-board",
    title: "モバイルUI",
    url: "https://mobile-ui.preview.adhd.gawarago.com",
  },
  {
    id: "login",
    kind: "draft",
    projectId: "task-board",
    title: "ログイン導線",
    url: "https://login.preview.adhd.gawarago.com",
  },
  {
    id: "dark",
    kind: "draft",
    projectId: "task-board",
    title: "ダークモード実験",
    url: "https://dark.preview.adhd.gawarago.com",
  },
  {
    id: "task-review",
    kind: "review",
    projectId: "task-board",
    title: "検証 v13",
    url: "https://staging.adhd.gawarago.com",
  },
  {
    id: "task-live",
    kind: "live",
    projectId: "task-board",
    title: "本番 v12",
    url: "https://adhd.gawarago.com",
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
    {
      id: "h1",
      title: "完了を下に寄せた",
      when: "今",
    },
    {
      id: "h2",
      title: "見出しを2段に分けた",
      when: "昨日 18:20",
    },
  ],
  messages: { "task-board": shopMessages },
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
