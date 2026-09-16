"use client";

import { useSyncExternalStore } from "react";

export interface LastWorkspace {
  name: string;
  path: string;
  slug: string;
}

const STORAGE_KEY = "adhd-last-workspace-v1";
const CHANGE_EVENT = "adhd-last-workspace";

const isSlug = (value: string): boolean => /^[a-z0-9-]+$/u.test(value);

const isAppPath = (path: string, slug: string): boolean =>
  path === `/p/${slug}` ||
  path === `/p/${slug}/creating` ||
  path === `/p/${slug}/envs` ||
  path === `/p/${slug}/publish`;

export const writeLastWorkspace = (value: LastWorkspace): void => {
  if (!isSlug(value.slug) || !isAppPath(value.path, value.slug)) {
    return;
  }
  window.localStorage.setItem(
    STORAGE_KEY,
    `${value.slug}\n${value.path}\n${value.name.trim()}`
  );
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const readLastWorkspace = (): LastWorkspace | null => {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const [slug, path, ...nameParts] = raw.split("\n");
  if (!slug || !path || !isSlug(slug) || !isAppPath(path, slug)) {
    return null;
  }
  return {
    name: nameParts.join("\n"),
    path,
    slug,
  };
};

export const rememberPath = (pathname: string, name = ""): void => {
  const parts = pathname.split("/");
  if (parts[1] !== "p" || !parts[2]) {
    return;
  }
  writeLastWorkspace({
    name,
    path: pathname,
    slug: parts[2],
  });
};

const subscribe = (onStoreChange: () => void): (() => void) => {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

export const useLastWorkspace = (): LastWorkspace | null =>
  useSyncExternalStore(subscribe, readLastWorkspace, () => null);
