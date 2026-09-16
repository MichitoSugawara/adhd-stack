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
    if (!input.chatgptAccessToken) {
      throw new Error("ChatGPT の接続がありません");
    }
    const auth = await toAuth({
      chatgptAccessToken: input.chatgptAccessToken,
      chatgptAccountId: input.chatgptAccountId,
    });
    return await getCodexTaskSnapshot(auth, input.taskId);
  },
  provisionEnvironment: async (input) => {
    if (!input.chatgptAccessToken) {
      throw new Error("ChatGPT の接続がありません");
    }
    const auth = await toAuth({
      chatgptAccessToken: input.chatgptAccessToken,
      chatgptAccountId: input.chatgptAccountId,
    });
    const environment = await ensureCodexEnvironment(
      auth,
      input.githubOwner,
      input.githubRepoName,
      input.label
    );
    return { environmentId: environment.id };
  },
  startTurn: async (input) => {
    if (!input.chatgptAccessToken) {
      throw new Error("ChatGPT の接続がありません");
    }
    const auth = await toAuth({
      chatgptAccessToken: input.chatgptAccessToken,
      chatgptAccountId: input.chatgptAccountId,
    });
    const taskId = await createCodexTask(
      auth,
      input.environmentId,
      input.prompt
    );
    return { taskId };
  },
  status: statusFromWorkspace,
};
