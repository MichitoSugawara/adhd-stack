import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");

const connect = await read("components/screens/connect-screen.tsx");
const connectCopy = await read("lib/connect-copy.ts");
const device = await read("components/screens/chatgpt-device-panel.tsx");
const publish = await read("components/screens/publish-panel.tsx");
const publishScreen = await read("components/screens/publish-screen.tsx");
const publishSteps = await read("lib/publish-steps.ts");
const urlChip = await read("components/screens/url-chip.tsx");
const session = await read("components/shell/session-effects.tsx");
const editor = await read("components/screens/editor-screen.tsx");
const editorRail = await read("components/screens/editor-env-rail.tsx");
const editorPane = await read("components/screens/editor-preview-pane.tsx");
const envs = await read("components/screens/envs-screen.tsx");
const envModals = await read("components/screens/env-modals.tsx");
const validators = await read("../../convex/validators.ts");
const sidebar = await read("components/primitives/SidebarNav.tsx");
const lastWorkspace = await read("lib/last-workspace.ts");
const login = await read("components/screens/login-screen.tsx");
const creating = await read("components/screens/creating-screen.tsx");
const projects = await read("components/screens/projects-screen.tsx");
const services = await read("lib/services.ts");

assert.match(connect, /useLastWorkspace/);
assert.match(connect, /openOauthTab/);
assert.match(connectCopy, /アプリに戻る/);
assert.match(connectCopy, /入力待ち/);
assert.doesNotMatch(connect, /一覧の骨格を見る/);
assert.doesNotMatch(connect, /つながったように見せません/);
assert.doesNotMatch(connect, /接続中…/);

assert.match(device, /入力ページを開く/);
assert.match(device, /btn-accent/);
assert.match(device, /ChatGPT 側の入力を待っています/);
assert.doesNotMatch(device, /接続中/);
assert.doesNotMatch(device, /確認しています/);
assert.doesNotMatch(device, /noreferrer/);

assert.match(publish, /LoadingState/);
assert.match(publish, /info-note/);
assert.match(publish, /本番へ出す/);
assert.match(publishSteps, /ページを組み立て/);
assert.match(publishSteps, /本番へ反映/);
assert.match(publishScreen, /保存先の準備/);
assert.match(urlChip, /完了はまだ見ていません/);
assert.doesNotMatch(publish, /偽の URL/);

assert.match(session, /rememberPath/);
assert.match(session, /router\.replace\("\/connect"\)/);

assert.match(editor, /usePublishFlow/);
assert.match(editor, /プレビュー/);
assert.match(editor, /環境/);
assert.match(editor, /TaskRows/);
assert.match(editor, /EditorEnvRail/);
assert.match(editor, /cloudflarePreviewUrl/);
assert.match(editor, /previewHref=\{previewUrl\}/);
assert.doesNotMatch(editor, /偽の成功/);
assert.match(editorRail, /previewUrl/);
assert.match(editorPane, /ENV_LABEL.preview/);
assert.match(envs, /cloudflarePreviewUrl/);

assert.match(envs, /ENV_LABEL.preview/);
assert.match(envs, /本番へ反映/);
assert.match(envModals, /新しいプレビュー/);
assert.match(validators, /cloudflarePreviewUrl/);
assert.match(validators, /ready: v.boolean/);
assert.doesNotMatch(validators, /githubRepoUrl/);
assert.doesNotMatch(validators, /githubRepoFullName/);
assert.doesNotMatch(validators, /originRepoUrl/);
assert.match(sidebar, /最初から/);
assert.match(sidebar, /一覧/);
assert.match(sidebar, /環境/);

assert.match(lastWorkspace, /adhd-last-workspace-v1/);
assert.match(lastWorkspace, /\/p\/\$\{slug\}/);
assert.match(lastWorkspace, /\/envs/);
assert.match(lastWorkspace, /\/publish/);

assert.doesNotMatch(login, /偽のログイン成功/);

const scmSurfaces = [
  ["creating", creating],
  ["projects", projects],
  ["editor", editor],
  ["editor-env-rail", editorRail],
  ["editor-preview-pane", editorPane],
  ["envs", envs],
  ["publish", publish],
  ["publish-screen", publishScreen],
  ["services", services],
  ["login", login],
  ["sidebar", sidebar],
];
const scmBan = /リポジトリ|ブランチ|コミット|プルリク|GitHub リポジトリ/u;
for (const [label, text] of scmSurfaces) {
  assert.doesNotMatch(text, scmBan, label);
}

console.log("ux copy ok");
