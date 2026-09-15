export interface TemplateFile {
  content: string;
  path: string;
}

export type TemplateKind = "tahcode_seed" | "tahcode_template";

const gitignore = `node_modules
.next
.vercel
.env
.env.local
dist
.wrangler
`;

const packageJsonFor = (slug: string): string =>
  `${JSON.stringify(
    {
      dependencies: {
        convex: "^1.45.0",
        next: "16.3.4",
        react: "19.2.8",
        "react-dom": "19.2.8",
      },
      description:
        "tahcode 由来の足場。Convex + Cloudflare + Beautiful UI を前提にする。プレビュー作成の本体 API はまだスタブ。",
      name: slug,
      private: true,
      scripts: {
        build: "next build",
        dev: "next dev",
      },
    },
    null,
    2
  )}\n`;

const readmeFor = (name: string, slug: string): string => `# ${name}

ADHD Stack が [tahcode](https://github.com/MichitoSugawara/tahcode) の型に合わせて置いた足場です。空のグリーンフィールドではありません。

リポジトリ名は作成画面の **${slug}** です。

## 入っているもの

- Convex の薄い schema（データ）
- Cloudflare / OpenNext を想定した wrangler の型
- Beautiful UI / Dark Green+ を前提にした最初の画面

## まだスタブ

- tahcode 本体のプレビュー作成 API と招待ハーネスは載せていない
- Pages / Convex への公開完了はホスト側の次の段階
- チーム向けの複数テナントは載せない

\`ADHD_TEMPLATE_REPO\` があれば、その GitHub テンプレートから作ります。無いときはこの足場を Contents API で置きます。
`;

const schemaTs = `import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    done: v.boolean(),
  }),
});
`;

const wranglerToml = `name = "app"
compatibility_date = "2026-01-01"
pages_build_output_dir = ".open-next"
`;

const pageTsx = `export default function Page() {
  return (
    <main
      style={{
        background: "#121712",
        color: "#cfd4cf",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        minHeight: "100vh",
        padding: 32,
      }}
    >
      <p style={{ color: "#8b928b", fontSize: 12 }}>tahcode 由来</p>
      <h1 style={{ fontSize: 28, marginTop: 8 }}>準備できた画面</h1>
      <p style={{ color: "#a8aea8", marginTop: 12 }}>
        Beautiful UI と Dark Green+ を前提にしています。プレビュー作成の本体はまだスタブです。
      </p>
    </main>
  );
}
`;

export const tahcodeSeedFiles = (args: {
  name: string;
  slug: string;
}): TemplateFile[] => [
  { content: readmeFor(args.name, args.slug), path: "README.md" },
  { content: packageJsonFor(args.slug), path: "package.json" },
  { content: gitignore, path: ".gitignore" },
  { content: schemaTs, path: "convex/schema.ts" },
  { content: wranglerToml, path: "wrangler.toml" },
  { content: pageTsx, path: "app/page.tsx" },
];

export const templateRepoFromEnv = ():
  | { owner: string; repo: string }
  | undefined => {
  const raw = process.env.ADHD_TEMPLATE_REPO?.trim();
  if (!raw) {
    return undefined;
  }
  const [owner, repo] = raw.split("/");
  if (!(owner && repo)) {
    return undefined;
  }
  return { owner, repo };
};
