"use client";

import { useEffect, useSyncExternalStore } from "react";

type ConnectionReturn = "/new" | null;

const STORAGE_KEY = "adhd-stack-connection-return-v1";
const listeners = new Set<() => void>();
let initialized = false;
let remembered: ConnectionReturn = null;

export const readConnectionReturn = (): ConnectionReturn => {
  if (!globalThis.window) {
    return null;
  }
  if (!initialized) {
    initialized = true;
    try {
      remembered =
        window.sessionStorage.getItem(STORAGE_KEY) === "/new" ? "/new" : null;
    } catch {
      // A restricted browser can keep this visit's intent in memory.
    }
  }
  return remembered;
};

const saveConnectionReturn = (next: ConnectionReturn): void => {
  if (!globalThis.window) {
    return;
  }
  initialized = true;
  remembered = next;
  try {
    if (next === null) {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } else {
      window.sessionStorage.setItem(STORAGE_KEY, next);
    }
  } catch {
    // Navigation remains available when browser storage is blocked.
  }
  for (const listener of listeners) {
    listener();
  }
};

export const rememberConnectionReturn = (requested: string | null): void => {
  if (requested === "/new") {
    saveConnectionReturn("/new");
  }
};

export const clearConnectionReturn = (): void => {
  saveConnectionReturn(null);
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const serverSnapshot = (): ConnectionReturn => null;

export const useConnectionReturn = (
  requested: string | null
): ConnectionReturn => {
  const saved = useSyncExternalStore(
    subscribe,
    readConnectionReturn,
    serverSnapshot
  );
  useEffect(() => {
    rememberConnectionReturn(requested);
  }, [requested]);
  return requested === "/new" ? "/new" : saved;
};
