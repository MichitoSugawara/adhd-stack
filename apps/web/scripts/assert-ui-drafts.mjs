import assert from "node:assert/strict";

const NEW_APP_KEY = "adhd-stack-new-app-draft-v1";
const IDEA_KEY = "adhd-stack-app-idea-v1:";
const RETURN_KEY = "adhd-stack-connection-return-v1";
const EMPTY_DRAFT = { idea: "", name: "" };
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

const setWindow = (value) => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value,
    writable: true,
  });
};

const memoryStorage = (entries = []) => {
  const values = new Map(entries);
  return {
    storage: {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => {
        values.delete(key);
      },
      setItem: (key, value) => {
        values.set(key, value);
      },
    },
    values,
  };
};

// A fresh module simulates a new page load or another tab's JavaScript realm.
const loadFresh = (path, scenario) => {
  const url = new URL(path, import.meta.url);
  url.searchParams.set("test", scenario);
  return import(url.href);
};

const loadDrafts = (scenario) => loadFresh("../lib/app-draft.ts", scenario);
const loadReturn = (scenario) =>
  loadFresh("../lib/connection-return.ts", scenario);

try {
  setWindow(undefined);
  const serverDrafts = await loadDrafts("server");
  const serverReturn = await loadReturn("server");
  assert.deepEqual(serverDrafts.readNewAppDraft(), EMPTY_DRAFT);
  assert.equal(serverDrafts.readAppIdeaDraft("notes"), "");
  assert.equal(serverReturn.readConnectionReturn(), null);
  assert.doesNotThrow(() => {
    serverDrafts.clearNewAppDraft();
    serverDrafts.clearAppIdeaDraft("notes");
    serverReturn.rememberConnectionReturn("/new");
    serverReturn.clearConnectionReturn();
  });
  assert.equal(serverReturn.readConnectionReturn(), null);

  const tabA = memoryStorage();
  setWindow({ sessionStorage: tabA.storage });
  const draftsA = await loadDrafts("tab-a");
  const draftA = { idea: "日々のメモをまとめたい", name: "メモ帳" };
  assert.deepEqual(draftsA.readNewAppDraft(), EMPTY_DRAFT);
  draftsA.saveNewAppDraft(draftA);
  assert.deepEqual(draftsA.readNewAppDraft(), draftA);
  assert.deepEqual(JSON.parse(tabA.values.get(NEW_APP_KEY)), draftA);

  const restoredA = await loadDrafts("tab-a-reload");
  assert.deepEqual(restoredA.readNewAppDraft(), draftA);

  const tabB = memoryStorage();
  setWindow({ sessionStorage: tabB.storage });
  const draftsB = await loadDrafts("tab-b");
  const draftB = { idea: "タスクを並べたい", name: "タスク" };
  assert.deepEqual(draftsB.readNewAppDraft(), EMPTY_DRAFT);
  draftsB.saveNewAppDraft(draftB);
  assert.deepEqual(draftsB.readNewAppDraft(), draftB);
  draftsB.clearNewAppDraft();
  assert.deepEqual(draftsB.readNewAppDraft(), EMPTY_DRAFT);
  assert.equal(tabB.values.has(NEW_APP_KEY), false);
  assert.deepEqual(JSON.parse(tabA.values.get(NEW_APP_KEY)), draftA);

  setWindow({ sessionStorage: tabA.storage });
  assert.deepEqual(draftsA.readNewAppDraft(), draftA);
  draftsA.clearNewAppDraft();
  assert.deepEqual(draftsA.readNewAppDraft(), EMPTY_DRAFT);
  assert.equal(tabA.values.has(NEW_APP_KEY), false);
  const clearedReload = await loadDrafts("cleared-reload");
  assert.deepEqual(clearedReload.readNewAppDraft(), EMPTY_DRAFT);

  const invalidDrafts = [
    "{broken",
    "null",
    JSON.stringify({ idea: "a", name: 42 }),
    JSON.stringify({ name: "missing idea" }),
    JSON.stringify({ idea: "a", name: "n".repeat(81) }),
    JSON.stringify({ idea: "a".repeat(4001), name: "name" }),
  ];
  for (const [index, raw] of invalidDrafts.entries()) {
    const invalidStorage = memoryStorage([[NEW_APP_KEY, raw]]);
    setWindow({ sessionStorage: invalidStorage.storage });
    const invalid = await loadDrafts(`invalid-${index}`);
    assert.deepEqual(invalid.readNewAppDraft(), EMPTY_DRAFT);
  }

  const ideasTab = memoryStorage();
  setWindow({ sessionStorage: ideasTab.storage });
  const ideas = await loadDrafts("ideas");
  ideas.saveAppIdeaDraft("notes", "カレンダーを追加したい");
  ideas.saveAppIdeaDraft("tasks", "完了したタスクをまとめたい");
  assert.equal(ideas.readAppIdeaDraft("notes"), "カレンダーを追加したい");
  assert.equal(ideas.readAppIdeaDraft("tasks"), "完了したタスクをまとめたい");
  const restoredIdeas = await loadDrafts("ideas-reload");
  assert.equal(
    restoredIdeas.readAppIdeaDraft("notes"),
    "カレンダーを追加したい"
  );
  ideas.clearAppIdeaDraft("notes");
  assert.equal(ideas.readAppIdeaDraft("notes"), "");
  assert.equal(ideasTab.values.has(`${IDEA_KEY}notes`), false);
  assert.equal(ideas.readAppIdeaDraft("tasks"), "完了したタスクをまとめたい");
  ideas.saveAppIdeaDraft("tasks", "");
  assert.equal(ideas.readAppIdeaDraft("tasks"), "");
  assert.equal(ideasTab.values.has(`${IDEA_KEY}tasks`), false);
  const clearedIdeas = await loadDrafts("ideas-cleared-reload");
  assert.equal(clearedIdeas.readAppIdeaDraft("notes"), "");
  assert.equal(clearedIdeas.readAppIdeaDraft("tasks"), "");

  const oauthTab = memoryStorage();
  setWindow({ sessionStorage: oauthTab.storage });
  const unsent = await loadDrafts("oauth-draft");
  unsent.saveNewAppDraft(draftA);
  unsent.saveAppIdeaDraft("notes", "送信前のアイデア");
  const intent = await loadReturn("oauth");
  assert.equal(intent.readConnectionReturn(), null);
  const rejectedDestinations = [
    "https://example.com",
    "//example.com",
    "/new?redirect=elsewhere",
    "/p/notes",
    "%2Fnew",
    null,
  ];
  for (const destination of rejectedDestinations) {
    intent.rememberConnectionReturn(destination);
    assert.equal(intent.readConnectionReturn(), null);
    assert.equal(oauthTab.values.has(RETURN_KEY), false);
  }
  intent.rememberConnectionReturn("/new");
  assert.equal(intent.readConnectionReturn(), "/new");
  assert.equal(oauthTab.values.get(RETURN_KEY), "/new");
  intent.rememberConnectionReturn("https://example.com");
  assert.equal(intent.readConnectionReturn(), "/new");
  const afterCallback = await loadReturn("oauth-callback-without-query");
  assert.equal(afterCallback.readConnectionReturn(), "/new");
  afterCallback.clearConnectionReturn();
  assert.equal(afterCallback.readConnectionReturn(), null);
  assert.equal(oauthTab.values.has(RETURN_KEY), false);
  const afterExit = await loadReturn("oauth-exit");
  assert.equal(afterExit.readConnectionReturn(), null);
  const untouchedDraft = await loadDrafts("oauth-draft-reload");
  assert.deepEqual(untouchedDraft.readNewAppDraft(), draftA);
  assert.equal(untouchedDraft.readAppIdeaDraft("notes"), "送信前のアイデア");

  const invalidIntentStorage = memoryStorage([
    [RETURN_KEY, "https://example.com"],
  ]);
  setWindow({ sessionStorage: invalidIntentStorage.storage });
  const invalidIntent = await loadReturn("invalid-stored-intent");
  assert.equal(invalidIntent.readConnectionReturn(), null);

  setWindow({
    get sessionStorage() {
      throw new Error("Browser storage is blocked");
    },
  });
  const blockedDrafts = await loadDrafts("blocked-storage");
  const blockedIntent = await loadReturn("blocked-storage");
  assert.deepEqual(blockedDrafts.readNewAppDraft(), EMPTY_DRAFT);
  assert.equal(blockedDrafts.readAppIdeaDraft("notes"), "");
  assert.equal(blockedIntent.readConnectionReturn(), null);
  blockedDrafts.saveNewAppDraft(draftA);
  blockedDrafts.saveAppIdeaDraft("notes", "保存できなくても入力を残す");
  blockedIntent.rememberConnectionReturn("/new");
  assert.deepEqual(blockedDrafts.readNewAppDraft(), draftA);
  assert.equal(
    blockedDrafts.readAppIdeaDraft("notes"),
    "保存できなくても入力を残す"
  );
  assert.equal(blockedIntent.readConnectionReturn(), "/new");
  blockedIntent.clearConnectionReturn();
  assert.equal(blockedIntent.readConnectionReturn(), null);
  assert.deepEqual(blockedDrafts.readNewAppDraft(), draftA);
  blockedDrafts.clearNewAppDraft();
  blockedDrafts.clearAppIdeaDraft("notes");
  assert.deepEqual(blockedDrafts.readNewAppDraft(), EMPTY_DRAFT);
  assert.equal(blockedDrafts.readAppIdeaDraft("notes"), "");
} finally {
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }
}

console.log("UI drafts and connection return intent ok");
