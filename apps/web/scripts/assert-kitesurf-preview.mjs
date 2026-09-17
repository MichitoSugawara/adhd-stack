import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const convexLib = path.resolve(import.meta.dirname, "../../../convex/lib");
const read = (relative) => readFile(path.join(root, relative), "utf8");

const dir = await mkdtemp(path.join(tmpdir(), "kitesurf-"));
const rewrite = (source) =>
  source
    .replaceAll('from "./httpJson"', 'from "./httpJson.ts"')
    .replaceAll('from "./jwt"', 'from "./jwt.ts"')
    .replaceAll('from "./publishResult"', 'from "./publishResult.ts"');

await writeFile(
  path.join(dir, "httpJson.ts"),
  await readFile(path.join(convexLib, "httpJson.ts"), "utf8")
);
await writeFile(
  path.join(dir, "jwt.ts"),
  rewrite(await readFile(path.join(convexLib, "jwt.ts"), "utf8"))
);
await writeFile(
  path.join(dir, "publishResult.ts"),
  await readFile(path.join(convexLib, "publishResult.ts"), "utf8")
);
await writeFile(
  path.join(dir, "browserRun.ts"),
  rewrite(await readFile(path.join(convexLib, "browserRun.ts"), "utf8"))
);

const {
  BROWSER_RUN_SCREENSHOT_PATHS,
  BROWSER_RUN_SETUP_MESSAGE,
  browserRunScreenshotUrl,
  classifyBrowserRunStatus,
  isWorkspacePreviewTarget,
  KITESURF_BROWSER,
  pickBrowserRunCredentials,
  viewportFor,
} = await import(pathToFileURL(path.join(dir, "browserRun.ts")).href);

const accountId = "6000b09b2e9e73b4b4fb59056ccba860";
const screenshotUrl = browserRunScreenshotUrl(accountId);
assert.equal(KITESURF_BROWSER, "kitesurf");
assert.match(screenshotUrl, /\/browser-run\/screenshot/);
assert.match(screenshotUrl, /browser=kitesurf/);
assert.equal(BROWSER_RUN_SCREENSHOT_PATHS[0], "browser-run/screenshot");
assert.deepEqual(viewportFor("mobile"), {
  deviceScaleFactor: 2,
  hasTouch: true,
  height: 844,
  isMobile: true,
  width: 390,
});
assert.equal(classifyBrowserRunStatus(403), "forbidden");
assert.equal(classifyBrowserRunStatus(500), "error");

const user = pickBrowserRunCredentials({
  platformAccountId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  platformToken: "platform",
  userAccountId: accountId,
  userToken: "user-token",
});
assert.equal(user.source, "user");
assert.equal(user.source === "user" ? user.accountId : "", accountId);

const missing = pickBrowserRunCredentials({});
assert.equal(missing.source, "missing");
assert.match(BROWSER_RUN_SETUP_MESSAGE, /Browser Run/);

assert.equal(
  isWorkspacePreviewTarget("https://app.pages.dev/", {
    cloudflarePagesUrl: "https://app.pages.dev",
  }),
  true
);
assert.equal(
  isWorkspacePreviewTarget("https://evil.example/", {
    cloudflarePagesUrl: "https://app.pages.dev",
  }),
  false
);

const pane = await read("components/screens/editor-preview-pane.tsx");
const creating = await read("components/screens/creating-screen.tsx");
const created = await read("components/screens/new-screen.tsx");
const sidebar = await read("components/primitives/SidebarNav.tsx");
const editor = await read("components/screens/editor-screen.tsx");
const actions = await readFile(
  path.join(convexLib, "../browserRunActions.ts"),
  "utf8"
);
const preview = await readFile(
  path.join(convexLib, "../workspacePreview.ts"),
  "utf8"
);
const browserRun = await readFile(
  path.join(convexLib, "browserRun.ts"),
  "utf8"
);

assert.match(pane, /useKitesurfPreview|KitesurfCanvas/);
assert.match(
  pane,
  /browser=kitesurf|KITESURF|captureWithKitesurf|useKitesurfPreview/
);
assert.doesNotMatch(pane, /<iframe/);
assert.match(creating, /\/envs/);
assert.match(creating, /環境を見る/);
assert.match(created, /writeLastWorkspace/);
assert.match(created, /\/creating/);
assert.match(sidebar, /環境/);
assert.match(editor, /slug=\{offline \? undefined : slug\}/);
assert.match(browserRun, /browser-run\/screenshot/);
assert.match(browserRun, /browser=kitesurf|KITESURF_BROWSER/);
assert.match(actions, /captureKitesurfScreenshot/);
assert.match(preview, /captureWithKitesurf/);
assert.match(preview, /getRender/);

console.log("kitesurf preview ok");
