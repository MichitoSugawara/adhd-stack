import { codexCloudBackend } from "./codexCloudBackend";
import type { CodingBackend, CodingBackendKind } from "./codingBackend";
import { cursorCloudBackend } from "./cursorCloudBackend";

export {
  defaultCodingBackend,
  isCursorApiConfigured,
} from "./codingBackendEnv";

export const getCodingBackend = (
  kind: CodingBackendKind | undefined
): CodingBackend => {
  if (kind === "cursor_cloud") {
    return cursorCloudBackend;
  }
  return codexCloudBackend;
};
