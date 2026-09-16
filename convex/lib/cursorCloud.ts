import type { CursorRunSnapshot } from "./cursorCloudMap";
import {
  CURSOR_API_KEY_MISSING,
  formatCursorTaskId,
  isCursorAgentId,
} from "./cursorCloudMap";
import { asList, asRecord, asString, payloadText, readJson } from "./httpJson";
import { busyHttpMessage, withHttpRetries } from "./httpRetry";

const CURSOR_API = "https://api.cursor.com";

interface CursorPromptBody {
  prompt: {
    text: string;
  };
}

interface CursorCreateAgentBody extends CursorPromptBody {
  autoCreatePR: boolean;
  name: string;
  repos: {
    startingRef: string;
    url: string;
  }[];
}

interface OriginCreateRepoBody {
  defaultBranch: string;
  name: string;
}

type CursorJsonBody =
  | CursorCreateAgentBody
  | CursorPromptBody
  | OriginCreateRepoBody;

export interface CursorCreatedIds {
  agentId: string;
  runId: string;
  taskId: string;
}

export const cursorApiKey = (): string | undefined =>
  process.env.CURSOR_API_KEY?.trim() || undefined;

export const originToken = (): string | undefined =>
  process.env.ORIGIN_TOKEN?.trim() ||
  process.env.CURSOR_ORIGIN_TOKEN?.trim() ||
  undefined;

export const originOwnerSlug = (): string | undefined =>
  process.env.ORIGIN_OWNER_SLUG?.trim() || undefined;

const basicAuthHeader = (apiKey: string): string => {
  const encoded = btoa(`${apiKey}:`);
  return `Basic ${encoded}`;
};

const requireCursorApiKey = (): string => {
  const key = cursorApiKey();
  if (!key) {
    throw new Error(CURSOR_API_KEY_MISSING);
  }
  return key;
};

const requestCursor = async (
  method: string,
  path: string,
  body?: CursorJsonBody
): Promise<{ payload: ReturnType<typeof asRecord>; status: number }> => {
  const apiKey = requireCursorApiKey();
  const response = await withHttpRetries(async () => {
    const result = await fetch(`${CURSOR_API}${path}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: basicAuthHeader(apiKey),
        "Content-Type": "application/json",
      },
      method,
    });
    return { response: result, status: result.status };
  });
  const payload = await readJson(response.response);
  if (!response.response.ok) {
    throw new Error(
      `Cursor: ${busyHttpMessage(response.status)} ${payloadText(payload)}`
    );
  }
  return { payload, status: response.status };
};

const requestOrigin = async (
  method: string,
  path: string,
  token: string,
  body?: OriginCreateRepoBody
): Promise<{ payload: ReturnType<typeof asRecord>; status: number }> => {
  const response = await withHttpRetries(async () => {
    const result = await fetch(`${CURSOR_API}${path}`, {
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method,
    });
    return { response: result, status: result.status };
  });
  return {
    payload: await readJson(response.response),
    status: response.status,
  };
};

export const verifyCursorApiKey = async (): Promise<void> => {
  await requestCursor("GET", "/v1/me");
};

export const ensureOriginRepo = async (
  name: string
): Promise<{ note: string; url?: string }> => {
  const token = originToken();
  const owner = originOwnerSlug();
  if (!(token && owner)) {
    return {
      note: "Origin トークンまたは OWNER_SLUG が無いので、GitHub リポジトリだけを Cloud Agent に渡します。",
    };
  }
  const created = await requestOrigin(
    "POST",
    `/v1/origin/repos/${encodeURIComponent(owner)}`,
    token,
    { defaultBranch: "main", name }
  );
  const { payload: createdPayload, status: createdStatus } = created;
  if (createdStatus >= 400 && createdStatus !== 409) {
    return {
      note: `Origin: リポジトリを作れませんでした（${payloadText(createdPayload)}）。Cloud Agent は GitHub URL で動かします。`,
    };
  }
  let payload = createdPayload;
  if (createdStatus === 409) {
    const existing = await requestOrigin(
      "GET",
      `/v1/origin/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
      token
    );
    const { payload: existingPayload, status: existingStatus } = existing;
    if (existingStatus >= 400) {
      return {
        note: "Origin: 既存リポジトリを読めませんでした。Cloud Agent は GitHub URL で動かします。",
      };
    }
    payload = existingPayload;
  }
  const url =
    asString(payload.cloneUrl) ??
    asString(asRecord(payload.repository).cloneUrl) ??
    `https://origin.cursor.com/git/${owner}/${name}.git`;
  return {
    note: "Origin リポジトリは用意しました。公開 Cloud Agents API は Origin URL をまだ拒否することがあるので、実行は GitHub URL で行います。",
    url,
  };
};

export const createCursorAgentRun = async (input: {
  label: string;
  prompt: string;
  repoUrl: string;
}): Promise<CursorCreatedIds> => {
  const { payload } = await requestCursor("POST", "/v1/agents", {
    autoCreatePR: false,
    name: input.label.slice(0, 100),
    prompt: { text: input.prompt },
    repos: [{ startingRef: "main", url: input.repoUrl }],
  });
  const agent = asRecord(payload.agent);
  const run = asRecord(payload.run);
  const agentId = asString(agent.id) ?? asString(payload.id);
  const runId =
    asString(run.id) ??
    asString(agent.latestRunId) ??
    asString(payload.latestRunId) ??
    asString(payload.runId);
  if (!(agentId && runId && isCursorAgentId(agentId))) {
    throw new Error("Cursor: エージェントを作れませんでした");
  }
  return {
    agentId,
    runId,
    taskId: formatCursorTaskId(agentId, runId),
  };
};

export const createCursorFollowUp = async (input: {
  agentId: string;
  prompt: string;
}): Promise<CursorCreatedIds> => {
  const { payload } = await requestCursor(
    "POST",
    `/v1/agents/${encodeURIComponent(input.agentId)}/runs`,
    { prompt: { text: input.prompt } }
  );
  const run = asRecord(payload.run);
  const runId = asString(run.id) ?? asString(payload.id);
  if (!runId) {
    throw new Error("Cursor: 続きの実行を始められませんでした");
  }
  return {
    agentId: input.agentId,
    runId,
    taskId: formatCursorTaskId(input.agentId, runId),
  };
};

export const getCursorRun = async (
  agentId: string,
  runId: string
): Promise<CursorRunSnapshot> => {
  const { payload } = await requestCursor(
    "GET",
    `/v1/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`
  );
  const git = asRecord(payload.git);
  const branches = asList(git.branches).map((item) => {
    const row = asRecord(item);
    return {
      branch: asString(row.branch),
      prUrl: asString(row.prUrl),
      repoUrl: asString(row.repoUrl),
    };
  });
  return {
    git: branches.length > 0 ? { branches } : undefined,
    result: asString(payload.result),
    status: asString(payload.status),
  };
};

export const githubRepoUrlFor = (owner: string, repo: string): string =>
  `https://github.com/${owner}/${repo}`;
