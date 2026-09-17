import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const read = (relative) => readFile(path.join(root, relative), "utf8");
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

const loadFresh = (scenario) => {
  const url = new URL("../lib/first-activation.ts", import.meta.url);
  url.searchParams.set("test", scenario);
  return import(url.href);
};

const connect = await read("components/screens/connect-screen.tsx");
const connectCopy = await read("lib/connect-copy.ts");
const firstActivation = await read("lib/first-activation.ts");
const advance = await read("lib/use-first-create-advance.ts");
const newScreen = await read("components/screens/new-screen.tsx");
const creating = await read("components/screens/creating-screen.tsx");
const journey = await read("components/shell/onboarding-journey.tsx");

assert.match(firstActivation, /shouldAdvanceToFirstCreate/);
assert.match(firstActivation, /destinationAfterConnect/);
assert.match(firstActivation, /adhd-first-activation-v1/);
assert.match(firstActivation, /\/new\?welcome=1/);
assert.match(connect, /useFirstCreateAdvance/);
assert.match(connect, /destinationAfterConnect/);
assert.match(connect, /useWorkspaceList/);
assert.match(connect, /useLastWorkspace/);
assert.match(advance, /shouldAdvanceToFirstCreate/);
assert.match(advance, /router\.replace\(firstCreateHref\(\)\)/);
assert.doesNotMatch(connect, /router\.replace\("\/new"\)/);
assert.doesNotMatch(advance, /router\.replace\("\/new"\)/);
assert.match(connectCopy, /つぎは最初のアプリ名を決める/);
assert.match(connectCopy, /アプリを作成/);
assert.match(newScreen, /firstCreateWelcome/);
assert.match(newScreen, /get\("welcome"\) === "1"/);
assert.match(newScreen, /OnboardingJourney current=\{2\}/);
assert.match(creating, /OnboardingJourney current=\{3\}/);
assert.match(journey, /接続/);
assert.match(journey, /アプリを作成/);
assert.match(journey, /作業開始/);

try {
  setWindow(undefined);
  const server = await loadFresh("server");
  assert.equal(server.firstCreateHref(), "/new?welcome=1");
  assert.equal(server.readFirstActivationConsumed(), false);
  assert.doesNotThrow(() => {
    server.markFirstActivationConsumed();
  });
  assert.equal(server.readFirstActivationConsumed(), false);
  assert.equal(
    server.shouldAdvanceToFirstCreate({
      allConnected: true,
      consumed: false,
      hasLastWorkspace: false,
      workspaceCount: 0,
    }),
    true,
    "first-run 4/4 with zero apps advances to create"
  );
  assert.equal(
    server.shouldAdvanceToFirstCreate({
      allConnected: true,
      consumed: false,
      hasLastWorkspace: true,
      workspaceCount: 0,
    }),
    false,
    "returning user with last workspace is not forced to create"
  );
  assert.equal(
    server.shouldAdvanceToFirstCreate({
      allConnected: true,
      consumed: false,
      hasLastWorkspace: false,
      workspaceCount: 2,
    }),
    false,
    "returning user with apps is not forced to create"
  );
  assert.equal(
    server.shouldAdvanceToFirstCreate({
      allConnected: true,
      consumed: true,
      hasLastWorkspace: false,
      workspaceCount: 0,
    }),
    false,
    "reconnect after first activation does not hijack create"
  );
  assert.equal(
    server.shouldAdvanceToFirstCreate({
      allConnected: false,
      consumed: false,
      hasLastWorkspace: false,
      workspaceCount: 0,
    }),
    false
  );
  assert.equal(
    server.shouldAdvanceToFirstCreate({
      allConnected: true,
      consumed: false,
      hasLastWorkspace: false,
      workspaceCount: null,
    }),
    false
  );
  assert.equal(
    server.destinationAfterConnect({
      lastPath: null,
      resumeWorkspace: false,
      workspaceCount: 0,
    }),
    "/new?welcome=1"
  );
  assert.equal(
    server.destinationAfterConnect({
      lastPath: "/p/notes",
      resumeWorkspace: true,
      workspaceCount: 1,
    }),
    "/p/notes"
  );
  assert.equal(
    server.destinationAfterConnect({
      lastPath: "/p/notes",
      resumeWorkspace: false,
      workspaceCount: 1,
    }),
    "/new"
  );

  const tab = memoryStorage();
  const listeners = new Set();
  setWindow({
    addEventListener: (name, listener) => {
      listeners.add(`${name}:${listener}`);
    },
    dispatchEvent: () => true,
    localStorage: tab.storage,
    removeEventListener: () => {
      // Persistence tests do not subscribe to storage events.
    },
  });
  const live = await loadFresh("live");
  assert.equal(live.readFirstActivationConsumed(), false);
  assert.equal(
    live.shouldAdvanceToFirstCreate({
      allConnected: true,
      consumed: live.readFirstActivationConsumed(),
      hasLastWorkspace: false,
      workspaceCount: 0,
    }),
    true
  );
  live.markFirstActivationConsumed();
  assert.equal(tab.values.get("adhd-first-activation-v1"), "consumed");
  assert.equal(live.readFirstActivationConsumed(), true);
  assert.equal(
    live.shouldAdvanceToFirstCreate({
      allConnected: true,
      consumed: live.readFirstActivationConsumed(),
      hasLastWorkspace: false,
      workspaceCount: 0,
    }),
    false
  );

  const restored = await loadFresh("restored");
  assert.equal(restored.readFirstActivationConsumed(), true);
  assert.equal(
    restored.shouldAdvanceToFirstCreate({
      allConnected: true,
      consumed: restored.readFirstActivationConsumed(),
      hasLastWorkspace: false,
      workspaceCount: 0,
    }),
    false
  );

  setWindow({
    addEventListener: () => {
      // Blocked storage still keeps an in-memory flag.
    },
    dispatchEvent: () => true,
    get localStorage() {
      throw new Error("Browser storage is blocked");
    },
    removeEventListener: () => {
      // Blocked storage still keeps an in-memory flag.
    },
  });
  const blocked = await loadFresh("blocked");
  assert.equal(blocked.readFirstActivationConsumed(), false);
  blocked.markFirstActivationConsumed();
  assert.equal(blocked.readFirstActivationConsumed(), true);
  assert.equal(
    blocked.shouldAdvanceToFirstCreate({
      allConnected: true,
      consumed: blocked.readFirstActivationConsumed(),
      hasLastWorkspace: false,
      workspaceCount: 0,
    }),
    false
  );
} finally {
  if (originalWindow) {
    Object.defineProperty(globalThis, "window", originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, "window");
  }
}

console.log("first activation onboarding ok");
