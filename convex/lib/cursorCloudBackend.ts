import type { CodingBackend } from "./codingBackend";
import { statusFromWorkspace } from "./codingBackend";
import type { NormalizedTurn } from "./codingEvents";
import {
  createCursorAgentRun,
  createCursorFollowUp,
  ensureOriginRepo,
  getCursorRun,
  githubRepoUrlFor,
  verifyCursorApiKey,
} from "./cursorCloud";
import {
  cursorRepoHandle,
  isCursorAgentId,
  isCursorRunDone,
  labelFromRepoUrl,
  mapCursorRunToTurn,
  parseCursorTaskId,
} from "./cursorCloudMap";

export const cursorCloudBackend: CodingBackend = {
  isTurnDone: (snapshot: NormalizedTurn) => isCursorRunDone(snapshot.status),
  kind: "cursor_cloud",
  pollTurn: async (input): Promise<NormalizedTurn> => {
    const ref = parseCursorTaskId(input.taskId);
    const snapshot = await getCursorRun(ref.agentId, ref.runId);
    return mapCursorRunToTurn(snapshot);
  },
  provisionEnvironment: async (input) => {
    await verifyCursorApiKey();
    const repoUrl =
      input.githubRepoUrl ??
      githubRepoUrlFor(input.githubOwner, input.githubRepoName);
    const origin = await ensureOriginRepo(input.githubRepoName);
    return {
      environmentId: cursorRepoHandle(repoUrl),
      originNote: origin.note,
      originRepoUrl: origin.url,
    };
  },
  startTurn: async (input) => {
    if (isCursorAgentId(input.environmentId)) {
      const follow = await createCursorFollowUp({
        agentId: input.environmentId,
        prompt: input.prompt,
      });
      return { environmentId: input.environmentId, taskId: follow.taskId };
    }
    const repoUrl = input.environmentId.startsWith("cursor-repo:")
      ? input.environmentId.slice("cursor-repo:".length)
      : input.environmentId;
    if (!repoUrl.startsWith("https://")) {
      throw new Error("Cursor: リポジトリ URL がありません");
    }
    const created = await createCursorAgentRun({
      label: labelFromRepoUrl(repoUrl),
      prompt: input.prompt,
      repoUrl,
    });
    return { environmentId: created.agentId, taskId: created.taskId };
  },
  status: statusFromWorkspace,
};
