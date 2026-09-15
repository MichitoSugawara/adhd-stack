import type { CodingBackend, CodingBackendKind } from "./codingBackend";
import { codexCloudBackend } from "./codexCloudBackend";
import { cursorCloudBackend } from "./cursorCloudBackend";

export const getCodingBackend = (
  kind: CodingBackendKind | undefined
): CodingBackend => {
  if (kind === "cursor_cloud") {
    return cursorCloudBackend;
  }
  return codexCloudBackend;
};
