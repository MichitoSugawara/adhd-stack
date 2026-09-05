export const THEME_KEY = "adhd-stack-theme";

export type ThemeName = "dark" | "light";

const isTheme = (value: string | null): value is ThemeName =>
  value === "dark" || value === "light";

export const readTheme = (): ThemeName => {
  if (!globalThis.window) {
    return "light";
  }
  const stored = window.localStorage.getItem(THEME_KEY);
  if (isTheme(stored)) {
    return stored;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const THEME_EVENT = "adhd-stack-theme-change";

export const applyTheme = (theme: ThemeName): void => {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new Event(THEME_EVENT));
};

export const subscribeTheme = (onStoreChange: () => void): (() => void) => {
  window.addEventListener(THEME_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};
