"use client";

import { useSyncExternalStore } from "react";

const CONNECT_ERROR_KEY = "adhd-connect-error";
const CONNECT_ERROR_EVENT = "adhd-connect-error";

export const writeConnectError = (message: string): void => {
  window.sessionStorage.setItem(CONNECT_ERROR_KEY, message);
  window.dispatchEvent(new Event(CONNECT_ERROR_EVENT));
};

const readStoredError = (): string | null =>
  window.sessionStorage.getItem(CONNECT_ERROR_KEY);

const subscribeError = (onStoreChange: () => void): (() => void) => {
  window.addEventListener(CONNECT_ERROR_EVENT, onStoreChange);
  return () => {
    window.removeEventListener(CONNECT_ERROR_EVENT, onStoreChange);
  };
};

export const useConnectBanner = (): string | null =>
  useSyncExternalStore(subscribeError, readStoredError, () => null);

export const connectErrorMessage = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : "接続に失敗しました";
  return raw.replace(/^oauth_not_configured:\s*/u, "");
};

export const oauthErrorCopy = (code: string): string => {
  if (code === "access_denied") {
    return "許可が取り消されました。もう一度つなぎ直してください";
  }
  if (code === "invalid_state") {
    return "接続の状態が無効です。もう一度つなぎ直してください";
  }
  if (code === "missing_code") {
    return "認可が完了しませんでした。もう一度つなぎ直してください";
  }
  if (code === "unknown_provider") {
    return "不明な接続です";
  }
  try {
    return decodeURIComponent(code);
  } catch {
    return "接続に失敗しました";
  }
};
