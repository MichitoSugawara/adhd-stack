import type { CodingBackendKind } from "./codingBackend";

export const defaultCodingBackend = (): CodingBackendKind => {
  if (process.env.ADHD_CODING_BACKEND?.trim() === "cursor_cloud") {
    return "cursor_cloud";
  }
  return "codex_cloud";
};

export const isCursorApiConfigured = (): boolean =>
  Boolean(process.env.CURSOR_API_KEY?.trim());
