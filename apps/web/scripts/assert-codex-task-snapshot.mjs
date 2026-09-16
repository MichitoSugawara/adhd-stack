import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const convexLib = path.resolve(import.meta.dirname, "../../../convex/lib");
const dir = await mkdtemp(path.join(tmpdir(), "codex-snap-"));
await writeFile(
  path.join(dir, "httpJson.ts"),
  await readFile(path.join(convexLib, "httpJson.ts"), "utf8")
);
await writeFile(
  path.join(dir, "codexCloudMap.ts"),
  (await readFile(path.join(convexLib, "codexCloudMap.ts"), "utf8")).replaceAll(
    'from "./httpJson"',
    'from "./httpJson.ts"'
  )
);

const { codexTaskSnapshotFromPayload, isCodexTaskDone } = await import(
  pathToFileURL(path.join(dir, "codexCloudMap.ts")).href
);

const userMessage = (text) => ({
  content: [{ content_type: "text", text }],
  role: "user",
  type: "message",
});

const assistantMessage = (text) => ({
  content: [{ content_type: "text", text }],
  role: "assistant",
  type: "message",
});

const emptySnapshot = {
  commands: [],
  files: [],
  texts: [],
  thinking: [],
};

const slackPrompt = "slackを作って";
const helloPrompt = "こんにちは、動作確認です";
const helloReply = "こんにちは！こちらは動作確認の返信です。";

const userInputOnly = codexTaskSnapshotFromPayload({
  current_assistant_turn: { turn_status: "in_progress" },
  current_user_turn: {
    input_items: [userMessage(slackPrompt)],
    output_items: [userMessage(slackPrompt)],
    turn_status: "completed",
  },
});
assert.deepEqual(userInputOnly.texts, []);
assert.equal(userInputOnly.status, "in_progress");
assert.equal(userInputOnly.work, "in_progress");
assert.equal(isCodexTaskDone(userInputOnly), false);

const echoedOnAssistantInput = codexTaskSnapshotFromPayload({
  current_assistant_turn: {
    input_items: [userMessage(helloPrompt)],
    output_items: [],
    turn_status: "in_progress",
  },
  current_user_turn: {
    input_items: [userMessage(helloPrompt)],
    turn_status: "completed",
  },
});
assert.deepEqual(echoedOnAssistantInput.texts, []);
assert.equal(echoedOnAssistantInput.work, "in_progress");
assert.equal(isCodexTaskDone(echoedOnAssistantInput), false);

const completedHello = codexTaskSnapshotFromPayload({
  current_assistant_turn: {
    input_items: [userMessage(helloPrompt)],
    output_items: [assistantMessage(helloReply)],
    turn_status: "completed",
  },
  current_user_turn: {
    input_items: [userMessage(helloPrompt)],
    turn_status: "completed",
  },
});
assert.deepEqual(completedHello.texts, [helloReply]);
assert.equal(completedHello.texts.includes(helloPrompt), false);
assert.equal(completedHello.status, "completed");
assert.equal(completedHello.work, "completed");
assert.equal(isCodexTaskDone(completedHello), true);

assert.equal(
  isCodexTaskDone({ ...emptySnapshot, texts: [slackPrompt] }),
  false
);
assert.equal(
  isCodexTaskDone({ ...emptySnapshot, status: "in_progress" }),
  false
);
assert.equal(isCodexTaskDone({ ...emptySnapshot, status: "pending" }), false);
assert.equal(isCodexTaskDone({ ...emptySnapshot, status: "running" }), false);
assert.equal(
  isCodexTaskDone({ ...emptySnapshot, status: "in-progress" }),
  false
);
assert.equal(
  isCodexTaskDone({ ...emptySnapshot, diff: "diff --git a/x b/x" }),
  false
);
assert.equal(
  isCodexTaskDone({
    ...emptySnapshot,
    status: "in_progress",
    texts: [helloReply],
  }),
  false
);
assert.equal(
  isCodexTaskDone({
    ...emptySnapshot,
    status: "completed",
    texts: [helloReply],
  }),
  true
);
assert.equal(isCodexTaskDone({ ...emptySnapshot, error: "failed" }), true);

const source = await readFile(path.join(convexLib, "codexCloud.ts"), "utf8");
assert.match(source, /codexTaskSnapshotFromPayload/);
assert.doesNotMatch(source, /asList\(turn\.input_items\)/);

console.log("codex task snapshot ok");
