export const THEME_KEY = "adhd-stack-theme";

export type ThemeChoice = "auto" | "dark" | "light";
export type ThemeName = "dark" | "light";

const isChoice = (value: string | null): value is ThemeChoice =>
  value === "auto" || value === "dark" || value === "light";

export const readChoice = (): ThemeChoice => {
  if (!globalThis.window) {
    return "auto";
  }
  const stored = window.localStorage.getItem(THEME_KEY);
  return isChoice(stored) ? stored : "auto";
};

export const resolveTheme = (choice: ThemeChoice): ThemeName => {
  if (choice === "auto") {
    if (!globalThis.window) {
      return "light";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return choice;
};

export const readTheme = (): ThemeName => resolveTheme(readChoice());

const THEME_EVENT = "adhd-stack-theme-change";

export const applyTheme = (choice: ThemeChoice): void => {
  document.documentElement.dataset.theme = resolveTheme(choice);
  window.localStorage.setItem(THEME_KEY, choice);
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
