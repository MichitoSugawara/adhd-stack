import assert from "node:assert/strict";

const CURSOR_API_KEY_MISSING =
  "Cursor の API キーがありません。Convex に CURSOR_API_KEY を入れてください。偽の実行はしません。";

const CURSOR_RUN_DONE = new Set(["CANCELLED", "ERROR", "EXPIRED", "FINISHED"]);

const fieldOf = (value, key) => {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  return Reflect.get(value, key);
};

const asString = (value) =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const isCursorAgentId = (value) => value.startsWith("bc-");

const parseCursorTaskId = (taskId) => {
  const [agentId, runId] = taskId.split("/");
  if (!(agentId && runId && isCursorAgentId(agentId))) {
    throw new Error("Cursor の作業番号が不正です");
  }
  return { agentId, runId };
};

const parseCursorCreated = (payload) => {
  const agent = fieldOf(payload, "agent");
  const run = fieldOf(payload, "run");
  const agentId =
    asString(fieldOf(agent, "id")) ?? asString(fieldOf(payload, "id"));
  const runId =
    asString(fieldOf(run, "id")) ??
    asString(fieldOf(agent, "latestRunId")) ??
    asString(fieldOf(payload, "latestRunId")) ??
    asString(fieldOf(payload, "runId"));
  if (!(agentId && runId && isCursorAgentId(agentId))) {
    throw new Error("Cursor: エージェントを作れませんでした");
  }
  return { agentId, runId };
};

const isCursorRunDone = (status) =>
  status !== undefined && CURSOR_RUN_DONE.has(status);

const workLabelForCursorStatus = (status) => {
  if (status === "CREATING") {
    return "実行環境を起こしています";
  }
  if (status === "RUNNING") {
    return "実行中";
  }
  if (status === "FINISHED") {
    return "完了";
  }
  if (status === "ERROR") {
    return "失敗";
  }
  if (status === "CANCELLED") {
    return "取り消されました";
  }
  if (status === "EXPIRED") {
    return "期限切れ";
  }
  return status ?? "作業中";
};

const mapCursorRunToTurn = (snapshot) => {
  const branches = snapshot.git?.branches ?? [];
  const files = branches
    .map((row) => row.prUrl ?? row.branch ?? row.repoUrl)
    .filter(Boolean);
  const texts = [];
  if (snapshot.result) {
    texts.push(snapshot.result);
  }
  for (const row of branches) {
    if (row.prUrl) {
      texts.push(row.prUrl);
    }
  }
  const failed = snapshot.status === "ERROR";
  return {
    commands: [],
    error: failed
      ? (snapshot.result ?? "Cursor Cloud Agent の実行が失敗しました")
      : undefined,
    files,
    status: snapshot.status,
    texts: failed ? [] : texts,
    thinking: [],
    work: workLabelForCursorStatus(snapshot.status),
  };
};

assert.match(CURSOR_API_KEY_MISSING, /偽の実行はしません/);
assert.deepEqual(parseCursorTaskId("bc-1/run-2"), {
  agentId: "bc-1",
  runId: "run-2",
});
assert.throws(() => parseCursorTaskId("wham-1"), /作業番号/);
assert.equal(isCursorRunDone("FINISHED"), true);
assert.equal(isCursorRunDone("RUNNING"), false);
assert.equal(isCursorRunDone("CREATING"), false);
assert.equal(isCursorRunDone("CANCELLED"), true);
assert.equal(isCursorRunDone("EXPIRED"), true);

assert.deepEqual(
  parseCursorCreated({
    agent: {
      id: "bc-00000000-0000-0000-0000-000000000001",
      latestRunId: "run-from-agent",
    },
    run: { id: "run-00000000-0000-0000-0000-000000000001" },
  }),
  {
    agentId: "bc-00000000-0000-0000-0000-000000000001",
    runId: "run-00000000-0000-0000-0000-000000000001",
  }
);
assert.throws(() => parseCursorCreated({ id: "not-an-agent" }), /エージェント/);

const creating = mapCursorRunToTurn({ status: "CREATING" });
assert.equal(creating.work, "実行環境を起こしています");
assert.equal(creating.texts.length, 0);
assert.equal(creating.thinking.length, 0);
assert.equal(creating.commands.length, 0);

const running = mapCursorRunToTurn({ status: "RUNNING" });
assert.equal(running.work, "実行中");
assert.equal(running.texts.length, 0);
assert.equal(running.thinking.length, 0);

const done = mapCursorRunToTurn({
  git: {
    branches: [
      {
        branch: "cursor/x",
        prUrl: "https://github.com/a/b/pull/1",
        repoUrl: "github.com/a/b",
      },
    ],
  },
  result: "README を足しました",
  status: "FINISHED",
});
assert.deepEqual(done.texts, [
  "README を足しました",
  "https://github.com/a/b/pull/1",
]);
assert.deepEqual(done.files, ["https://github.com/a/b/pull/1"]);
assert.equal(done.error, undefined);
assert.equal(done.work, "完了");

const failed = mapCursorRunToTurn({
  result: "repository_access",
  status: "ERROR",
});
assert.equal(failed.error, "repository_access");
assert.equal(failed.texts.length, 0);
assert.equal(failed.work, "失敗");

console.log("cursor cloud map ok");
