import type { CodingBackend } from "./codingBackend";
import { statusFromWorkspace } from "./codingBackend";

const notReadyError = (): Error => new Error("この実行環境はまだ使えません");

export const cursorCloudBackend: CodingBackend = {
  isTurnDone: () => true,
  kind: "cursor_cloud",
  pollTurn: () => Promise.reject(notReadyError()),
  provisionEnvironment: () => Promise.reject(notReadyError()),
  startTurn: () => Promise.reject(notReadyError()),
  status: statusFromWorkspace,
};
