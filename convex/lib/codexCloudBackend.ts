import {
  createCodexTask,
  ensureCodexEnvironment,
  getCodexTaskSnapshot,
  isCodexTaskDone,
  resolveCodexAccountId,
} from "./codexCloud";
import type { CodingBackend } from "./codingBackend";
import { statusFromWorkspace } from "./codingBackend";
import type { NormalizedTurn } from "./codingEvents";

const toAuth = async (input: {
  chatgptAccessToken: string;
  chatgptAccountId?: string;
}) => {
  const accountId = await resolveCodexAccountId(
    input.chatgptAccessToken,
    input.chatgptAccountId
  );
  return { accessToken: input.chatgptAccessToken, accountId };
};

export const codexCloudBackend: CodingBackend = {
  isTurnDone: (snapshot) => isCodexTaskDone(snapshot),
  kind: "codex_cloud",
  pollTurn: async (input): Promise<NormalizedTurn> => {
    const auth = await toAuth(input);
    return await getCodexTaskSnapshot(auth, input.taskId);
  },
  provisionEnvironment: async (input) => {
    const auth = await toAuth(input);
    const environment = await ensureCodexEnvironment(
      auth,
      input.githubOwner,
      input.githubRepoName,
      input.label
    );
    return { environmentId: environment.id };
  },
  startTurn: async (input) => {
    const auth = await toAuth(input);
    const taskId = await createCodexTask(
      auth,
      input.environmentId,
      input.prompt
    );
    return { taskId };
  },
  status: statusFromWorkspace,
};
