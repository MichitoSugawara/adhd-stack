import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const convexLib = path.resolve(import.meta.dirname, "../../../convex/lib");
const convexRoot = path.resolve(import.meta.dirname, "../../../convex");
const dir = await mkdtemp(path.join(tmpdir(), "fn-push-"));

const rewrite = (source) =>
  source
    .replaceAll('from "./httpJson"', 'from "./httpJson.ts"')
    .replaceAll('from "./pagesEnv"', 'from "./pagesEnv.ts"');

await writeFile(
  path.join(dir, "httpJson.ts"),
  await readFile(path.join(convexLib, "httpJson.ts"), "utf8")
);
await writeFile(
  path.join(dir, "pagesEnv.ts"),
  rewrite(await readFile(path.join(convexLib, "pagesEnv.ts"), "utf8"))
);
await writeFile(
  path.join(dir, "convexProject.ts"),
  rewrite(await readFile(path.join(convexLib, "convexProject.ts"), "utf8"))
);
await writeFile(
  path.join(dir, "appTemplate.ts"),
  await readFile(path.join(convexLib, "appTemplate.ts"), "utf8")
);
await writeFile(
  path.join(dir, "publishResult.ts"),
  await readFile(path.join(convexLib, "publishResult.ts"), "utf8")
);

const {
  CONVEX_PAGES_BUILD_COMMAND,
  mergePagesBuildConfig,
  mergePagesProductionEnvVars,
  pagesConvexEnvUpdates,
} = await import(pathToFileURL(path.join(dir, "pagesEnv.ts")).href);
const {
  convexDeployKeyFromPayload,
  convexDeploymentNameForApi,
  deploymentNameFromConvexUrl,
} = await import(pathToFileURL(path.join(dir, "convexProject.ts")).href);
const { tahcodeSeedFiles } = await import(
  pathToFileURL(path.join(dir, "appTemplate.ts")).href
);
const {
  CONVEX_FUNCTION_PUSH_NOTE,
  hasFunctionPushOutcome,
  noteForFunctionPush,
} = await import(pathToFileURL(path.join(dir, "publishResult.ts")).href);
const webCopy = await import("../lib/publish-copy.ts");

assert.equal(
  CONVEX_PAGES_BUILD_COMMAND,
  'npx convex deploy --yes --cmd "npm run build"'
);
assert.match(CONVEX_PAGES_BUILD_COMMAND, /convex deploy --yes/);

const mergedEnv = mergePagesProductionEnvVars(
  {
    KEEP_PLAIN: { type: "plain_text", value: "ok" },
    KEEP_SECRET: { type: "secret_text" },
  },
  pagesConvexEnvUpdates({
    convexUrl: "https://happy-animal-123.convex.cloud",
    deployKey: "prod:happy-animal-123|test",
    deploymentName: "happy-animal-123",
  })
);
assert.equal(mergedEnv.KEEP_PLAIN?.value, "ok");
assert.equal(mergedEnv.KEEP_SECRET?.type, "secret_text");
assert.equal(mergedEnv.CONVEX_DEPLOY_KEY?.type, "secret_text");
assert.equal(mergedEnv.CONVEX_DEPLOY_KEY?.value, "prod:happy-animal-123|test");
assert.equal(
  mergedEnv.NEXT_PUBLIC_CONVEX_URL?.value,
  "https://happy-animal-123.convex.cloud"
);

const buildConfig = mergePagesBuildConfig(
  { destination_dir: ".open-next", root_dir: "" },
  CONVEX_PAGES_BUILD_COMMAND
);
assert.equal(buildConfig.build_command, CONVEX_PAGES_BUILD_COMMAND);
assert.equal(buildConfig.destination_dir, ".open-next");

assert.equal(
  convexDeploymentNameForApi("prod:happy-animal-123"),
  "happy-animal-123"
);
assert.equal(
  convexDeploymentNameForApi("happy-animal-123"),
  "happy-animal-123"
);
assert.equal(
  deploymentNameFromConvexUrl("https://happy-animal-123.convex.cloud/"),
  "happy-animal-123"
);
assert.equal(
  convexDeployKeyFromPayload({ deployKey: "dev:box|ey" }),
  "dev:box|ey"
);

assert.equal(webCopy.CONVEX_FUNCTION_PUSH_NOTE, CONVEX_FUNCTION_PUSH_NOTE);
assert.match(CONVEX_FUNCTION_PUSH_NOTE, /Pages ビルドの convex deploy/);
assert.doesNotMatch(CONVEX_FUNCTION_PUSH_NOTE, /バンドルできないため未実施/);
assert.match(
  noteForFunctionPush("configured"),
  /デプロイキーを Cloudflare Pages/
);
assert.match(noteForFunctionPush("configured"), /完了を待っていません/);
assert.match(noteForFunctionPush("key_only"), /関数は未実施/);
assert.match(noteForFunctionPush("failed"), /関数の自動プッシュは未実施/);
assert.equal(hasFunctionPushOutcome([noteForFunctionPush("configured")]), true);
assert.equal(hasFunctionPushOutcome(["Pages だけ"]), false);

const seeds = tahcodeSeedFiles({ name: "Demo", slug: "demo-app" });
const packageJson = seeds.find((file) => file.path === "package.json");
const tsconfig = seeds.find((file) => file.path === "tsconfig.json");
const nextConfig = seeds.find((file) => file.path === "next.config.ts");
const openNextConfig = seeds.find((file) => file.path === "open-next.config.ts");
const wrangler = seeds.find((file) => file.path === "wrangler.toml");
const gitignore = seeds.find((file) => file.path === ".gitignore");
const workflow = seeds.find(
  (file) => file.path === ".github/workflows/convex-deploy.yml"
);
const convexJson = seeds.find((file) => file.path === "convex.json");
const packageManifest = JSON.parse(packageJson?.content ?? "{}");
assert.equal(packageManifest.devDependencies?.typescript, "7.0.2");
assert.equal(packageManifest.devDependencies?.["@types/node"], "26.4.1");
assert.equal(packageManifest.devDependencies?.["@types/react"], "19.2.18");
assert.equal(packageManifest.devDependencies?.["@types/react-dom"], "19.2.5");
assert.equal(packageManifest.devDependencies?.wrangler, "^4.128.0");
assert.equal(
  packageManifest.dependencies?.["@opennextjs/cloudflare"],
  "^1.20.6"
);
assert.equal(packageManifest.scripts?.build, "opennextjs-cloudflare build");
assert.equal(packageManifest.scripts?.["build:next"], "next build");
assert.match(
  packageJson?.content ?? "",
  /"convex:deploy": "convex deploy --yes"/
);
assert.match(tsconfig?.content ?? "", /"jsx": "react-jsx"/);
assert.match(tsconfig?.content ?? "", /\*\*\/\*\.tsx/);
assert.match(nextConfig?.content ?? "", /initOpenNextCloudflareForDev/);
assert.match(openNextConfig?.content ?? "", /defineCloudflareConfig/);
assert.match(openNextConfig?.content ?? "", /buildCommand: "next build"/);
assert.match(wrangler?.content ?? "", /pages_build_output_dir = "\.open-next"/);
assert.match(gitignore?.content ?? "", /^\.open-next$/m);
assert.match(workflow?.content ?? "", /workflow_dispatch/);
assert.match(workflow?.content ?? "", /npx convex deploy --yes/);
assert.doesNotMatch(workflow?.content ?? "", /on:\s*\n\s*push:/);
assert.match(convexJson?.content ?? "", /"functions": "convex\/"/);

const publishActions = await readFile(
  path.join(convexRoot, "publishActions.ts"),
  "utf8"
);
const pushIdx = publishActions.indexOf("await pushConvexFunctionsViaPages");
const triggerIdx = publishActions.indexOf("await triggerPagesDeployment");
assert.ok(pushIdx > 0, "publish must call function push");
assert.ok(
  triggerIdx > pushIdx,
  "Pages deploy must start after function push setup"
);
assert.doesNotMatch(publishActions, /CONVEX_FUNCTION_PUSH_NOTE/);
assert.match(publishActions, /PAGES_DEPLOY_STARTED_NOTE/);

const pages = await readFile(
  path.join(convexLib, "cloudflarePages.ts"),
  "utf8"
);
assert.match(pages, /configurePagesForConvexDeploy/);
assert.match(pages, /CONVEX_PAGES_BUILD_COMMAND/);

const ocConvex = await readFile(
  path.join(convexLib, "convexFromOpenConnector.ts"),
  "utf8"
);
assert.match(ocConvex, /createConvexDeployKeyViaOpenConnector/);
assert.match(ocConvex, /convexCreateDeployKeyInput/);
assert.match(ocConvex, /create_deploy_key/);

console.log("convex function push ok");
