"use client";

import { useSyncExternalStore } from "react";
import { z } from "zod";

interface NewAppDraft {
  idea: string;
  name: string;
}

const NEW_APP_KEY = "adhd-stack-new-app-draft-v1";
const APP_IDEA_KEY = "adhd-stack-app-idea-v1:";
const emptyDraft: NewAppDraft = { idea: "", name: "" };
let draft: NewAppDraft = emptyDraft;
let initialized = false;
const listeners = new Set<() => void>();
const ideaDrafts = new Map<string, string>();
const newAppDraftSchema = z.object({
  idea: z.string().max(4000),
  name: z.string().max(80),
});

const readStorage = (key: string): string | null => {
  if (!globalThis.window) {
    return null;
  }
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string | null): void => {
  if (!globalThis.window) {
    return;
  }
  try {
    if (value === null) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // Restricted browser storage should not prevent editing a draft in this visit.
  }
};

export const readNewAppDraft = (): NewAppDraft => {
  if (!initialized && globalThis.window) {
    initialized = true;
    const raw = readStorage(NEW_APP_KEY);
    if (raw) {
      try {
        const parsed = newAppDraftSchema.safeParse(JSON.parse(raw));
        if (parsed.success) {
          draft = parsed.data;
        }
      } catch {
        // A stale or invalid browser draft starts as an empty form.
      }
    }
  }
  return draft;
};

export const saveNewAppDraft = (next: NewAppDraft): void => {
  initialized = true;
  draft = next;
  writeStorage(NEW_APP_KEY, JSON.stringify(next));
  for (const listener of listeners) {
    listener();
  }
};

export const clearNewAppDraft = (): void => {
  draft = emptyDraft;
  initialized = true;
  writeStorage(NEW_APP_KEY, null);
  for (const listener of listeners) {
    listener();
  }
};

const subscribeDraft = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const serverDraft = (): NewAppDraft => emptyDraft;

export const useNewAppDraft = (): NewAppDraft =>
  useSyncExternalStore(subscribeDraft, readNewAppDraft, serverDraft);

/** This is an unsent chat draft, never an instruction to run automatically. */
export const readAppIdeaDraft = (slug: string): string =>
  ideaDrafts.get(slug) ?? readStorage(`${APP_IDEA_KEY}${slug}`) ?? "";

export const saveAppIdeaDraft = (slug: string, idea: string): void => {
  ideaDrafts.set(slug, idea);
  writeStorage(`${APP_IDEA_KEY}${slug}`, idea || null);
};

export const clearAppIdeaDraft = (slug: string): void => {
  ideaDrafts.delete(slug);
  writeStorage(`${APP_IDEA_KEY}${slug}`, null);
};
