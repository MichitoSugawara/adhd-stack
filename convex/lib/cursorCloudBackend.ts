import type { CodingBackend } from "./codingBackend";
import { statusFromWorkspace } from "./codingBackend";

const notReady = (): never => {
  throw new Error("この実行環境はまだ使えません");
};

export const cursorCloudBackend: CodingBackend = {
  kind: "cursor_cloud",
  isTurnDone: () => true,
  pollTurn: async () => notReady(),
  provisionEnvironment: async () => notReady(),
  startTurn: async () => notReady(),
  status: statusFromWorkspace,
};
