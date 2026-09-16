export interface TemplateFile {
  content: string;
  path: string;
}

export type TemplateKind = "tahcode_seed" | "tahcode_template";

const gitignore = `node_modules
.next
.open-next
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
        "@opennextjs/cloudflare": "^1.20.6",
        convex: "^1.45.0",
        next: "16.3.4",
        react: "19.2.8",
        "react-dom": "19.2.8",
      },
      description:
        "tahcode 由来の足場。Convex + Cloudflare + Beautiful UI を前提にする。プレビュー作成の本体 API はまだスタブ。",
      devDependencies: {
        "@types/node": "26.4.1",
        "@types/react": "19.2.18",
        "@types/react-dom": "19.2.5",
        typescript: "7.0.2",
        wrangler: "^4.128.0",
      },
      name: slug,
      private: true,
      scripts: {
        build: "opennextjs-cloudflare build",
        "build:next": "next build",
        "convex:deploy": "convex deploy --yes",
        dev: "next dev",
      },
    },
    null,
    2
  )}\n`;

const nextConfigTs = `import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

if (process.env.npm_lifecycle_event === "dev") {
  initOpenNextCloudflareForDev();
}
`;

const openNextConfigTs = `import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig(),
  buildCommand: "next build",
};
`;

const tsconfigJson = `${JSON.stringify(
  {
    compilerOptions: {
      esModuleInterop: true,
      incremental: true,
      isolatedModules: true,
      jsx: "react-jsx",
      lib: ["dom", "dom.iterable", "esnext"],
      module: "esnext",
      moduleResolution: "bundler",
      noEmit: true,
      plugins: [{ name: "next" }],
      resolveJsonModule: true,
      skipLibCheck: true,
      strict: true,
      target: "ES2022",
    },
    exclude: ["node_modules"],
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  },
  null,
  2
)}\n`;

const readmeFor = (name: string, slug: string): string => `# ${name}

ADHD Stack が [tahcode](https://github.com/MichitoSugawara/tahcode) の型に合わせて置いた足場です。空のグリーンフィールドではありません。

リポジトリ名は作成画面の **${slug}** です。

## 入っているもの

- Convex の薄い schema（データ）
- OpenNext（\`@opennextjs/cloudflare\`）。\`npm run build\` は \`.open-next\` を出す
- Cloudflare Pages 向け \`wrangler.toml\`（\`pages_build_output_dir = ".open-next"\`）
- TypeScript（\`typescript\` / \`@types/node\` / \`@types/react\` / \`@types/react-dom\`）と \`tsconfig.json\`
- Beautiful UI / Dark Green+ を前提にした最初の画面（\`app/page.tsx\`）

## 公開と Convex 関数

ホストはこのリポジトリへ関数バンドルを送りません。公開時にデプロイキーを Cloudflare Pages 本番の \`CONVEX_DEPLOY_KEY\` へ載せ、Pages のビルドコマンドを \`npx convex deploy --yes --cmd "npm run build"\` にします。関数が載るのはそのビルドが成功したあとです。

手動で送るときは \`CONVEX_DEPLOY_KEY\` を置いて \`npm run convex:deploy\` を実行します。GitHub Actions の \`convex-deploy\` は手動実行だけです。Actions の secret は自動では載せません。

## まだスタブ

- tahcode 本体のプレビュー作成 API と招待ハーネスは載せていない
- チーム向けの複数テナントは載せない

\`ADHD_TEMPLATE_REPO\` があれば、その GitHub テンプレートから作ります。無いときはこの足場を Contents API で置きます。
`;

const convexJson = `{
  "functions": "convex/"
}
`;

const convexDeployWorkflow = `name: convex-deploy
on:
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "22"
      - run: npm ci
      - run: npx convex deploy --yes
        env:
          CONVEX_DEPLOY_KEY: \${{ secrets.CONVEX_DEPLOY_KEY }}
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
compatibility_date = "2026-09-03"
compatibility_flags = ["nodejs_compat"]
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
  { content: tsconfigJson, path: "tsconfig.json" },
  { content: nextConfigTs, path: "next.config.ts" },
  { content: openNextConfigTs, path: "open-next.config.ts" },
  { content: gitignore, path: ".gitignore" },
  { content: convexJson, path: "convex.json" },
  {
    content: convexDeployWorkflow,
    path: ".github/workflows/convex-deploy.yml",
  },
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
