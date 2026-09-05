import type {
  AppState,
  Connections,
  HistoryPoint,
  Message,
  Preview,
  Project,
  SideMessage,
  TerminalLine,
} from "./mock-types";
import { previewUrl } from "./preview-ui";

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

export const SOURCE_FILES = {
  "app/globals.css": [
    ".tasks { padding: 20px; display: grid; gap: 14px; }",
    ".list { display: grid; gap: 10px; }",
    ".list.muted { opacity: .5; text-decoration: line-through; }",
    ".muted { color: var(--neutral-600); font-size: 16px; margin-top: 8px; }",
  ],
  "app/layout.tsx": [
    'import "./globals.css";',
    'import type { ReactNode } from "react";',
    "",
    'export const metadata = { title: "task-board" };',
    "",
    "export default function RootLayout({ children }: { children: ReactNode }) {",
    "  return (",
    '    <html lang="ja">',
    "      <body>{children}</body>",
    "    </html>",
    "  );",
    "}",
  ],
  "app/tasks/page.tsx": [
    '"use client";',
    'import { useMutation, useQuery } from "convex/react";',
    'import { api } from "../../convex/_generated/api";',
    "",
    "export default function TasksPage() {",
    "  const tasks = useQuery(api.tasks.list) ?? [];",
    "  const toggle = useMutation(api.tasks.toggle);",
    "",
    "  const open = tasks.filter((t) => !t.done);",
    "  const done = tasks.filter((t) => t.done);",
    "",
    "  return (",
    '    <main className="tasks">',
    "      <h1>今日やること</h1>",
    "      <TaskList items={open} onToggle={toggle} />",
    '      <h2 className="muted">完了 · {done.length}</h2>',
    "      <TaskList items={done} onToggle={toggle} muted />",
    "    </main>",
    "  );",
    "}",
  ],
  "convex/schema.ts": [
    'import { defineSchema, defineTable } from "convex/server";',
    'import { v } from "convex/values";',
    "",
    "export default defineSchema({",
    "  tasks: defineTable({",
    "    title: v.string(),",
    "    done: v.boolean(),",
    "    createdAt: v.number(),",
    "  }),",
    "});",
  ],
  "convex/tasks.ts": [
    'import { mutation, query } from "./_generated/server";',
    'import { v } from "convex/values";',
    "",
    "export const list = query({",
    '  handler: (ctx) => ctx.db.query("tasks").order("desc").collect(),',
    "});",
  ],
  "package.json": ["{", '  "name": "task-board",', '  "private": true', "}"],
} as const;

export const sourceLinesOf = (path: string): readonly string[] => {
  if (path === "app/globals.css") {
    return SOURCE_FILES["app/globals.css"];
  }
  if (path === "app/layout.tsx") {
    return SOURCE_FILES["app/layout.tsx"];
  }
  if (path === "app/tasks/page.tsx") {
    return SOURCE_FILES["app/tasks/page.tsx"];
  }
  if (path === "convex/schema.ts") {
    return SOURCE_FILES["convex/schema.ts"];
  }
  if (path === "convex/tasks.ts") {
    return SOURCE_FILES["convex/tasks.ts"];
  }
  if (path === "package.json") {
    return SOURCE_FILES["package.json"];
  }
  return [];
};

export const SOURCE_TREE = [
  { depth: 0, kind: "dir" as const, label: "app/", path: "app/" },
  {
    depth: 1,
    kind: "file" as const,
    label: "layout.tsx",
    path: "app/layout.tsx",
  },
  {
    depth: 1,
    kind: "file" as const,
    label: "tasks/page.tsx",
    path: "app/tasks/page.tsx",
  },
  {
    depth: 1,
    kind: "file" as const,
    label: "globals.css",
    path: "app/globals.css",
  },
  { depth: 0, kind: "dir" as const, label: "convex/", path: "convex/" },
  {
    depth: 1,
    kind: "file" as const,
    label: "schema.ts",
    path: "convex/schema.ts",
  },
  {
    depth: 1,
    kind: "file" as const,
    label: "tasks.ts",
    path: "convex/tasks.ts",
  },
  {
    depth: 0,
    kind: "file" as const,
    label: "package.json",
    path: "package.json",
  },
];

const taskChanges = [
  {
    add: "+18",
    del: "−6",
    file: "app/tasks/page.tsx",
    lines: [
      {
        kind: "ctx" as const,
        text: "  const toggle = useMutation(api.tasks.toggle);",
      },
      {
        kind: "add" as const,
        text: "  const open = tasks.filter((t) => !t.done);",
      },
      {
        kind: "add" as const,
        text: "  const done = tasks.filter((t) => t.done);",
      },
      { kind: "del" as const, text: "      <h1>タスク</h1>" },
      { kind: "add" as const, text: "      <h1>今日やること</h1>" },
    ],
  },
  {
    add: "+9",
    del: "",
    file: "app/globals.css",
    lines: [{ kind: "add" as const, text: ".list.muted { opacity: .5; }" }],
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
    meta: { seconds: "3秒" },
  },
  {
    body: "一覧を「今日やること」と「完了」に分けました。完了は薄いグレーで下に寄せています。右の「画面」で確認できます。",
    id: "m3",
    kind: "ai",
  },
  {
    body: "2ファイル",
    id: "m4",
    kind: "changes",
    meta: { additions: 27, deletions: 6, files: taskChanges },
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    creatingStep: 5,
    id: "task-board",
    latestPreview: "モバイルUI",
    liveUrl: "adhd.gawarago.com",
    name: "task-board",
    reservedPrompt: "",
    rowState: "作業中",
    status: "ready",
    updated: "5分前",
  },
  {
    creatingStep: 5,
    id: "micronix-mas250",
    latestPreview: "計測フローを確認",
    liveUrl: "micronix.pages.dev",
    name: "micronix-mas250",
    reservedPrompt: "",
    rowState: "作業中",
    status: "ready",
    updated: "18分前",
  },
  {
    creatingStep: 5,
    id: "withx-replace",
    latestPreview: "Gate 0 review",
    liveUrl: "withx.pages.dev",
    name: "withx-replace",
    reservedPrompt: "",
    rowState: "検証待ち",
    status: "ready",
    updated: "昨日 16:42",
  },
];

export const INITIAL_PREVIEWS: Preview[] = [
  {
    conflict: false,
    id: "mobile",
    kind: "draft",
    projectId: "task-board",
    savepoints: [{ title: "見出しを2段に分けた", when: "昨日 18:20" }],
    slug: "mobile-ui",
    state: "作業中",
    title: "モバイルUI",
    url: previewUrl("mobile-ui"),
  },
  {
    conflict: true,
    id: "login",
    kind: "draft",
    projectId: "task-board",
    savepoints: [{ title: "GitHub ログインの下書き", when: "昨日 18:40" }],
    slug: "login",
    state: "要確認",
    title: "ログイン導線",
    url: previewUrl("login"),
  },
  {
    conflict: false,
    id: "dark",
    kind: "draft",
    projectId: "task-board",
    savepoints: [],
    slug: "dark",
    state: "3日前",
    title: "ダークモード実験",
    url: previewUrl("dark"),
  },
];

const history: HistoryPoint[] = [
  {
    current: true,
    id: "h1",
    meta: "2ファイル · +27 −6 · モバイルUI に反映済み",
    title: "完了を下に寄せた",
    when: "今",
    where: "preview",
  },
  {
    id: "h2",
    meta: "1ファイル · +12 −4",
    title: "見出しを2段に分けた",
    when: "昨日 18:20",
    where: "preview",
  },
  {
    id: "h3",
    meta: "検証 v13 から分岐",
    title: "プレビュー「モバイルUI」を作成",
    when: "昨日 17:02",
    where: "preview",
  },
  {
    id: "h4",
    meta: "検証に反映 · staging.adhd.gawarago.com",
    title: "v13 · タスク管理アプリ",
    when: "3日前",
    where: "review",
  },
  {
    id: "h5",
    meta: "本番に反映 · adhd.gawarago.com",
    title: "v12 · 初期セットアップ",
    when: "先週",
    where: "live",
  },
];

const terminal: TerminalLine[] = [
  { text: "$ pnpm dlx convex dev --once", tone: "plain" },
  { text: "✓ Convex functions ready (2.1s)", tone: "ok" },
  { text: "$ pnpm --filter web typecheck", tone: "plain" },
  { text: "✓ 1.8s", tone: "ok" },
];

const sideMessages: SideMessage[] = [
  {
    body: "左の作業とは別に、ここで何でも聞けます。コードは変えません。",
    id: "s1",
    kind: "ai",
  },
];

export const emptyState = (): AppState => ({
  banner: null,
  busy: false,
  connecting: null,
  connections: emptyConnections(),
  deployFailed: false,
  dirty: false,
  failed: null,
  history: [],
  messages: {},
  openaiKey: "",
  overlap: null,
  previews: [],
  prod: 12,
  prodHistory: [],
  projects: [],
  reservedPrompt: "",
  returnSummary: false,
  secrets: [],
  session: null,
  sideMessages: [],
  staging: 13,
  terminal: [],
  toast: "",
  usage: 0,
});

export const initialState = (): AppState => ({
  banner: null,
  busy: false,
  connecting: null,
  connections: emptyConnections(),
  deployFailed: false,
  dirty: true,
  failed: null,
  history,
  messages: { "task-board": shopMessages },
  openaiKey: "",
  overlap: null,
  previews: INITIAL_PREVIEWS,
  prod: 12,
  prodHistory: [
    { label: "v12 初期セットアップ", when: "先週" },
    { label: "v11 空のサイト", when: "先週" },
  ],
  projects: INITIAL_PROJECTS,
  reservedPrompt: "",
  returnSummary: true,
  secrets: [
    { key: "STRIPE_SECRET", lane: "review", value: "••••••" },
    { key: "STRIPE_SECRET", lane: "live", value: "••••••" },
  ],
  session: null,
  sideMessages,
  staging: 13,
  terminal,
  toast: "",
  usage: 62,
});
