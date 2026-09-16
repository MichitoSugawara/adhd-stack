import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");

const connect = await read("components/screens/connect-screen.tsx");
const device = await read("components/screens/chatgpt-device-panel.tsx");
const publish = await read("components/screens/publish-panel.tsx");
const session = await read("components/shell/session-effects.tsx");
const editor = await read("components/screens/editor-screen.tsx");
const lastWorkspace = await read("lib/last-workspace.ts");
const login = await read("components/screens/login-screen.tsx");

assert.match(connect, /アプリに戻る/);
assert.match(connect, /useLastWorkspace/);
assert.match(connect, /入力待ち/);
assert.doesNotMatch(connect, /一覧の骨格を見る/);
assert.doesNotMatch(connect, /つながったように見せません/);
assert.doesNotMatch(connect, /接続中…/);

assert.match(device, /入力ページを開く/);
assert.match(device, /bg-ink/);
assert.match(device, /ChatGPT 側の入力を待っています/);
assert.doesNotMatch(device, /接続中/);
assert.doesNotMatch(device, /確認しています/);

assert.match(publish, /LoadingState/);
assert.match(publish, /完了はまだ見ていません/);
assert.doesNotMatch(publish, /偽の URL/);

assert.match(session, /rememberPath/);
assert.match(session, /router\.replace\("\/connect"\)/);

assert.match(editor, /usePublishFlow/);
assert.doesNotMatch(editor, /偽の成功/);

assert.match(lastWorkspace, /adhd-last-workspace-v1/);
assert.match(lastWorkspace, /\/p\/\$\{slug\}/);

assert.doesNotMatch(login, /偽のログイン成功/);

console.log("ux copy ok");
