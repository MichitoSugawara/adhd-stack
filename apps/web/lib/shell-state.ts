"use client";

import { useSyncExternalStore } from "react";

export type AppStatus = "creating" | "ready";

export type MessageKind = "ai" | "thinking" | "tools" | "user";

export interface ShellApp {
  createdAt: number;
  id: string;
  name: string;
  status: AppStatus;
  step: number;
}

export interface ShellMessage {
  body: string;
  id: string;
  kind: MessageKind;
}

export interface ShellState {
  apps: ShellApp[];
  entered: boolean;
  messages: Record<string, ShellMessage[]>;
}

const STORAGE_KEY = "adhd-stack-shell-v1";

const emptyState: ShellState = {
  apps: [],
  entered: false,
  messages: {},
};

let memory: ShellState = emptyState;
let didReadStore = false;
const listeners = new Set<() => void>();

const slugFromName = (name: string): string => {
  const trimmed = name.trim();
  const slug = trimmed
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "")
    .slice(0, 48);
  if (slug.length > 0) {
    return slug;
  }
  return `app-${String(Date.now())}`;
};

const uniqueId = (name: string, existing: readonly ShellApp[]): string => {
  const base = slugFromName(name);
  if (!existing.some((app) => app.id === base)) {
    return base;
  }
  return `${base}-${String(Date.now()).slice(-5)}`;
};

const emit = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

const persist = (next: ShellState): void => {
  memory = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

const parseApp = (value: unknown): ShellApp | null => {
  const record = asRecord(value);
  if (record === null) {
    return null;
  }
  if (typeof record.id !== "string" || typeof record.name !== "string") {
    return null;
  }
  if (typeof record.createdAt !== "number" || typeof record.step !== "number") {
    return null;
  }
  if (record.status !== "creating" && record.status !== "ready") {
    return null;
  }
  return {
    createdAt: record.createdAt,
    id: record.id,
    name: record.name,
    status: record.status,
    step: record.step,
  };
};

const parseMessage = (value: unknown): ShellMessage | null => {
  const record = asRecord(value);
  if (record === null) {
    return null;
  }
  if (typeof record.id !== "string" || typeof record.body !== "string") {
    return null;
  }
  if (
    record.kind !== "ai" &&
    record.kind !== "thinking" &&
    record.kind !== "tools" &&
    record.kind !== "user"
  ) {
    return null;
  }
  return {
    body: record.body,
    id: record.id,
    kind: record.kind,
  };
};

const parseState = (raw: string): ShellState => {
  try {
    const record = asRecord(JSON.parse(raw));
    if (record === null) {
      return emptyState;
    }
    const apps: ShellApp[] = [];
    if (Array.isArray(record.apps)) {
      for (const item of record.apps) {
        const app = parseApp(item);
        if (app !== null) {
          apps.push(app);
        }
      }
    }
    const messages: Record<string, ShellMessage[]> = {};
    const storedMessages = asRecord(record.messages);
    if (storedMessages !== null) {
      for (const [appId, list] of Object.entries(storedMessages)) {
        if (!Array.isArray(list)) {
          continue;
        }
        const parsed: ShellMessage[] = [];
        for (const item of list) {
          const message = parseMessage(item);
          if (message !== null) {
            parsed.push(message);
          }
        }
        messages[appId] = parsed;
      }
    }
    return {
      apps,
      entered: record.entered === true,
      messages,
    };
  } catch {
    return emptyState;
  }
};

const readStored = (): ShellState => {
  if (typeof window === "undefined") {
    return memory;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return emptyState;
  }
  return parseState(raw);
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSnapshot = (): ShellState => {
  if (!didReadStore && typeof window !== "undefined") {
    memory = readStored();
    didReadStore = true;
  }
  return memory;
};

const getServerSnapshot = (): ShellState => emptyState;

const getHydratedSnapshot = (): boolean => true;

const getHydratedServerSnapshot = (): boolean => false;

const subscribeHydrated =
  (_listener: () => void): (() => void) =>
  () => {
    // Client snapshot is always hydrated; no store events.
  };

export const hydrateShellState = (): void => {
  memory = readStored();
  didReadStore = true;
  emit();
};

export const enterShell = (): void => {
  persist({ ...memory, entered: true });
};

export const leaveShell = (): void => {
  persist({ ...memory, entered: false });
};

export const createApp = (name: string): string => {
  const app: ShellApp = {
    createdAt: Date.now(),
    id: uniqueId(name, memory.apps),
    name: name.trim(),
    status: "creating",
    step: 0,
  };
  persist({
    ...memory,
    apps: [app, ...memory.apps],
  });
  return app.id;
};

export const setAppStep = (appId: string, step: number): void => {
  persist({
    ...memory,
    apps: memory.apps.map((app) => {
      if (app.id !== appId) {
        return app;
      }
      return {
        ...app,
        status: step >= 5 ? "ready" : "creating",
        step,
      };
    }),
  });
};

export const appendMessage = (
  appId: string,
  input: { body: string; kind: MessageKind }
): void => {
  const current = memory.messages[appId] ?? [];
  const message: ShellMessage = {
    body: input.body,
    id: `${appId}-${String(Date.now())}-${input.kind}`,
    kind: input.kind,
  };
  persist({
    ...memory,
    messages: {
      ...memory.messages,
      [appId]: [...current, message],
    },
  });
};

export const useShell = (): {
  appendMessage: typeof appendMessage;
  createApp: typeof createApp;
  enterShell: typeof enterShell;
  hydrated: boolean;
  leaveShell: typeof leaveShell;
  setAppStep: typeof setAppStep;
  state: ShellState;
} => {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = useSyncExternalStore(
    subscribeHydrated,
    getHydratedSnapshot,
    getHydratedServerSnapshot
  );

  return {
    appendMessage,
    createApp,
    enterShell,
    hydrated,
    leaveShell,
    setAppStep,
    state,
  };
};
