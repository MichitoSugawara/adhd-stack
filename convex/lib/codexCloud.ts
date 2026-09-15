import { busyHttpMessage, withHttpRetries } from "./httpRetry";
import {
  asList,
  asNumber,
  asRecord,
  asString,
  payloadText,
  readJson,
} from "./httpJson";
import { chatgptAccountIdFromToken, isUsableCodexAccountId } from "./jwt";

export const CODEX_CLOUD_BASE = "https://chatgpt.com/backend-api";

export interface CodexCloudAuth {
  accessToken: string;
  accountId?: string;
}

export interface CodexEnvironment {
  id: string;
  label?: string;
}

export interface CodexTaskSnapshot {
  commands: string[];
  diff?: string;
  error?: string;
  files: string[];
  status?: string;
  texts: string[];
  thinking: string[];
  work?: string;
}

export const DEFAULT_CODEX_MACHINE_ID = "wham-public/wham-universal";

const headersFor = (auth: CodexCloudAuth): HeadersInit => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${auth.accessToken}`,
    "Content-Type": "application/json",
    // Codex CLI / Kumo: HTTP header, not a query param.
    originator: "codex_cli_rs",
  };
  if (auth.accountId) {
    headers["ChatGPT-Account-Id"] = auth.accountId;
  }
  return headers;
};

const requestOnce = async (
  auth: CodexCloudAuth,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{
  ok: boolean;
  payload: Record<string, unknown>;
  status: number;
}> => {
  const response = await fetch(`${CODEX_CLOUD_BASE}${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: headersFor(auth),
    method,
  });
  return {
    ok: response.ok,
    payload: await readJson(response),
    status: response.status,
  };
};

const request = async (
  auth: CodexCloudAuth,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<{
  ok: boolean;
  payload: Record<string, unknown>;
  status: number;
}> => {
  const result = await withHttpRetries(() =>
    requestOnce(auth, method, path, body)
  );
  if ((result.status === 429 || result.status === 503) && !result.ok) {
    return {
      ok: false,
      payload: { message: busyHttpMessage(result.status) },
      status: result.status,
    };
  }
  return result;
};

const environmentFrom = (value: unknown): CodexEnvironment | undefined => {
  const row = asRecord(value);
  const id = asString(row.id) ?? asString(row.environment_id);
  if (!id) {
    return undefined;
  }
  return { id, label: asString(row.label) ?? asString(row.name) };
};

const environmentsFromPayload = (
  payload: Record<string, unknown>
): CodexEnvironment[] => {
  const rows = asList(payload.environments ?? payload.items ?? payload.data);
  const source = rows.length > 0 ? rows : asList(payload);
  return source
    .map((item) => environmentFrom(item))
    .filter((item): item is CodexEnvironment => item !== undefined);
};

export const resolveCodexAccountId = async (
  accessToken: string,
  storedAccountId?: string
): Promise<string | undefined> => {
  const fromJwt = chatgptAccountIdFromToken(accessToken);
  if (fromJwt) {
    return fromJwt;
  }
  if (isUsableCodexAccountId(storedAccountId)) {
    return storedAccountId;
  }
  const response = await request(
    { accessToken },
    "GET",
    "/wham/accounts/check"
  );
  if (!response.ok) {
    return undefined;
  }
  const defaultId = asString(response.payload.default_account_id);
  const accounts = asList(response.payload.accounts);
  const first = asRecord(accounts[0]);
  const checked =
    defaultId ??
    asString(first.id) ??
    asString(asRecord(first.account).account_id) ??
    asString(asRecord(first.account).id);
  return isUsableCodexAccountId(checked) ? checked : undefined;
};

const GITHUB_CONNECT_HINT =
  "ChatGPT Codex で GitHub を接続してください。https://chatgpt.com/codex を開き、Environment 作成画面から GitHub を繋いでから、もう一度試してください";

const githubConnectHint = (text: string): string | undefined => {
  const lower = text.toLowerCase();
  const mentionsGithub = lower.includes("github");
  const mentionsLink =
    lower.includes("connect") ||
    lower.includes("link") ||
    lower.includes("install") ||
    lower.includes("authorization") ||
    lower.includes("not connected") ||
    lower.includes("no installation") ||
    lower.includes("permission") ||
    lower.includes("connector");
  if (mentionsGithub && mentionsLink) {
    return GITHUB_CONNECT_HINT;
  }
  return undefined;
};

export const formatCodexHttpError = (
  status: number,
  payload: Record<string, unknown>
): string => {
  const text = payloadText(payload);
  const hint = githubConnectHint(text);
  if (hint) {
    return `${hint}（API ${status}: ${text}）`;
  }
  return `Codex Cloud 環境を作成できませんでした: HTTP ${status} ${text}`;
};

const rowsFromPayload = (
  payload: Record<string, unknown>,
  keys: string[]
): unknown[] => {
  for (const key of keys) {
    const rows = asList(payload[key]);
    if (rows.length > 0) {
      return rows;
    }
  }
  return Array.isArray(payload) ? payload : [];
};

const machineIdFrom = (value: unknown): string | undefined => {
  const row = asRecord(value);
  return (
    asString(row.id) ??
    asString(row.machine_id) ??
    asString(row.slug) ??
    asString(asRecord(row.machine).id)
  );
};

export const listCodexMachineId = async (
  auth: CodexCloudAuth
): Promise<{ id: string; probe: string }> => {
  const response = await request(auth, "GET", "/wham/machines");
  const probe = `/wham/machines HTTP ${response.status} ${payloadText(response.payload)}`;
  if (response.ok) {
    const rows = rowsFromPayload(response.payload, [
      "machines",
      "items",
      "data",
    ]);
    const preferred = rows.find((item) => {
      const row = asRecord(item);
      const label = (
        asString(row.label) ??
        asString(row.name) ??
        asString(row.slug) ??
        ""
      ).toLowerCase();
      return label.includes("default") || label.includes("universal");
    });
    const id = machineIdFrom(preferred) ?? machineIdFrom(rows[0]);
    if (id) {
      return { id, probe };
    }
  }
  return { id: DEFAULT_CODEX_MACHINE_ID, probe };
};

const githubIdFromPrefixed = (
  value: string | undefined
): number | undefined => {
  if (!value?.startsWith("github-")) {
    return undefined;
  }
  return asNumber(value.slice("github-".length));
};

const githubIdFromRow = (row: Record<string, unknown>): number | undefined =>
  asNumber(row.github_repo_id) ??
  asNumber(row.repository_id) ??
  asNumber(asRecord(row.repository).id) ??
  asNumber(row.external_id) ??
  githubIdFromPrefixed(asString(row.id)) ??
  githubIdFromPrefixed(asString(row.external_id)) ??
  asNumber(row.id);

const ownerNameFrom = (
  ownerValue: unknown,
  nameValue: unknown
): string | undefined => {
  const owner = asString(ownerValue) ?? asString(asRecord(ownerValue).login);
  const name = asString(nameValue);
  return owner && name ? `${owner}/${name}` : undefined;
};

const fullNameFromRow = (row: Record<string, unknown>): string | undefined => {
  const nested = asRecord(row.repository);
  return (
    asString(row.full_name) ??
    asString(row.fullName) ??
    asString(row.repo_full_name) ??
    asString(nested.full_name) ??
    ownerNameFrom(row.owner, row.name ?? row.repo) ??
    ownerNameFrom(nested.owner, nested.name)
  );
};

const matchInstalledRepoId = (
  rows: unknown[],
  owner: string,
  repo: string
): number | undefined => {
  const needle = `${owner}/${repo}`.toLowerCase();
  const repoLower = repo.toLowerCase();
  const parsed = rows.map((item) => asRecord(item));
  const exact = parsed.find(
    (row) => (fullNameFromRow(row) ?? "").toLowerCase() === needle
  );
  if (exact) {
    return githubIdFromRow(exact);
  }
  const byName = parsed.filter((row) => {
    const full = (fullNameFromRow(row) ?? "").toLowerCase();
    const name = (asString(row.name) ?? asString(row.repo) ?? "").toLowerCase();
    return full.endsWith(`/${repoLower}`) || name === repoLower;
  });
  const [only] = byName;
  return byName.length === 1 && only ? githubIdFromRow(only) : undefined;
};

export const findInstalledGithubRepoId = async (
  auth: CodexCloudAuth,
  owner: string,
  repo: string
): Promise<{ id?: number; probe: string }> => {
  const probes: string[] = [];
  for (const term of [repo, `${owner}/${repo}`]) {
    const path = `/wham/github/repositories/search/all-installations?${new URLSearchParams({ query: term }).toString()}`;
    const response = await request(auth, "GET", path);
    probes.push(
      `${path} HTTP ${response.status} ${payloadText(response.payload)}`
    );
    if (!response.ok) {
      continue;
    }
    const rows = [
      ...rowsFromPayload(response.payload, [
        "repositories",
        "items",
        "data",
        "results",
      ]),
      ...asList(response.payload.installations).flatMap((item) =>
        asList(asRecord(item).repositories)
      ),
    ];
    const id = matchInstalledRepoId(rows, owner, repo);
    if (id !== undefined) {
      return { id, probe: probes.join(" | ") };
    }
  }
  return { probe: probes.join(" | ") };
};

export const listEnvironmentsForRepo = async (
  auth: CodexCloudAuth,
  owner: string,
  repo: string
): Promise<CodexEnvironment[]> => {
  const byRepo = await request(
    auth,
    "GET",
    `/wham/environments/by-repo/github/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  );
  if (byRepo.ok) {
    const direct =
      environmentFrom(byRepo.payload) ??
      environmentFrom(byRepo.payload.environment);
    if (direct) {
      return [direct];
    }
    const found = environmentsFromPayload(byRepo.payload);
    if (found.length > 0) {
      return found;
    }
  }
  const all = await request(auth, "GET", "/wham/environments");
  if (!all.ok) {
    return [];
  }
  const needle = `${owner}/${repo}`.toLowerCase();
  return environmentsFromPayload(all.payload).filter((env) => {
    const label = env.label?.toLowerCase() ?? "";
    return label.includes(needle) || label.includes(repo.toLowerCase());
  });
};

export const createCodexEnvironment = async (
  auth: CodexCloudAuth,
  owner: string,
  repo: string,
  label?: string
): Promise<CodexEnvironment> => {
  const installed = await findInstalledGithubRepoId(auth, owner, repo);
  if (installed.id === undefined) {
    throw new Error(
      `${GITHUB_CONNECT_HINT}（ChatGPT 側に ${owner}/${repo} が見えません: ${installed.probe}）`
    );
  }
  const machines = await listCodexMachineId(auth);
  const response = await request(auth, "POST", "/wham/environments", {
    label: label ?? `${owner}/${repo}`,
    machine_id: machines.id,
    repos: [`github-${installed.id}`],
  });
  if (response.ok) {
    const created =
      environmentFrom(response.payload) ??
      environmentFrom(response.payload.environment) ??
      environmentsFromPayload(response.payload)[0];
    if (created) {
      return created;
    }
  }
  throw new Error(formatCodexHttpError(response.status, response.payload));
};

export const ensureCodexEnvironment = async (
  auth: CodexCloudAuth,
  owner: string,
  repo: string,
  label?: string
): Promise<CodexEnvironment> => {
  const existing = await listEnvironmentsForRepo(auth, owner, repo);
  if (existing[0]) {
    return existing[0];
  }
  return await createCodexEnvironment(auth, owner, repo, label);
};

export const createCodexTask = async (
  auth: CodexCloudAuth,
  environmentId: string,
  prompt: string,
  branch = "main"
): Promise<string> => {
  const response = await request(auth, "POST", "/wham/tasks", {
    input_items: [
      {
        content: [{ content_type: "text", text: prompt }],
        role: "user",
        type: "message",
      },
    ],
    new_task: {
      branch,
      environment_id: environmentId,
      run_environment_in_qa_mode: false,
    },
  });
  if (!response.ok) {
    if (response.status === 429 || response.status === 503) {
      throw new Error(busyHttpMessage(response.status));
    }
    const detail =
      asString(response.payload.message) ??
      asString(response.payload.error) ??
      `HTTP ${response.status}`;
    throw new Error(`実行環境に送れませんでした: ${detail}`);
  }
  const task = asRecord(response.payload.task);
  const id =
    asString(task.id) ??
    asString(response.payload.id) ??
    asString(response.payload.task_id);
  if (!id) {
    throw new Error("Codex Cloud のタスク ID を受け取れませんでした");
  }
  return id;
};

const textFromContent = (value: unknown): string[] => {
  if (typeof value === "string" && value.trim().length > 0) {
    return [value];
  }
  return asList(value).flatMap((part) => {
    if (typeof part === "string" && part.trim().length > 0) {
      return [part];
    }
    const row = asRecord(part);
    const text = asString(row.text) ?? asString(row.content);
    return text ? [text] : [];
  });
};

const collectFromItems = (
  items: unknown[]
): Pick<CodexTaskSnapshot, "commands" | "diff" | "files" | "texts"> => {
  const commands: string[] = [];
  const files: string[] = [];
  const texts: string[] = [];
  let diff: string | undefined;
  for (const item of items) {
    const row = asRecord(item);
    const kind = asString(row.type) ?? asString(row.kind) ?? "";
    const command =
      asString(row.command) ??
      asString(row.cmd) ??
      asString(asRecord(row.function).name);
    if (command) {
      commands.push(command);
    }
    const itemDiff =
      asString(row.diff) ?? asString(asRecord(row.output_diff).diff);
    if (itemDiff && (kind === "output_diff" || kind === "pr" || !diff)) {
      diff = itemDiff;
    }
    const itemFiles = asList(row.files).flatMap((file) => {
      if (typeof file === "string") {
        return [file];
      }
      const path =
        asString(asRecord(file).path) ?? asString(asRecord(file).filename);
      return path ? [path] : [];
    });
    files.push(...itemFiles);
    if (kind === "message" || kind === "reasoning" || kind === "thinking") {
      texts.push(...textFromContent(row.content));
    }
  }
  return { commands, diff, files, texts };
};

export const getCodexTaskSnapshot = async (
  auth: CodexCloudAuth,
  taskId: string
): Promise<CodexTaskSnapshot> => {
  const response = await request(auth, "GET", `/wham/tasks/${taskId}`);
  if (!response.ok) {
    throw new Error(
      `Codex Cloud の進捗を取れませんでした: HTTP ${response.status}`
    );
  }
  const assistant = asRecord(response.payload.current_assistant_turn);
  const diffTurn = asRecord(response.payload.current_diff_task_turn);
  const userTurn = asRecord(response.payload.current_user_turn);
  const turns = [assistant, diffTurn, userTurn].filter(
    (turn) => Object.keys(turn).length > 0
  );
  const commands: string[] = [];
  const files: string[] = [];
  const texts: string[] = [];
  const thinking: string[] = [];
  let diff: string | undefined;
  let work: string | undefined;
  for (const turn of turns) {
    const status = asString(turn.turn_status);
    if (status) {
      work = status;
    }
    const collected = collectFromItems([
      ...asList(turn.output_items),
      ...asList(turn.input_items),
    ]);
    const {
      commands: nextCommands,
      diff: nextDiff,
      files: nextFiles,
      texts: nextTexts,
    } = collected;
    commands.push(...nextCommands);
    files.push(...nextFiles);
    texts.push(...nextTexts);
    if (nextDiff) {
      diff = nextDiff;
    }
    const { worklog } = turn;
    const log = asRecord(worklog);
    for (const message of asList(log.messages)) {
      const row = asRecord(message);
      const parts = textFromContent(asRecord(row.content).parts);
      const author = asString(asRecord(row.author).role) ?? "";
      if (author === "assistant" || author === "system") {
        thinking.push(...parts);
      } else {
        thinking.push(...parts);
      }
    }
    const error = asRecord(turn.error);
    if (asString(error.message)) {
      return {
        commands: [...new Set(commands)],
        diff,
        error: asString(error.message),
        files: [...new Set(files)],
        status,
        texts,
        thinking,
        work,
      };
    }
  }
  const display = asRecord(
    assistant.latest_turn_status_display ??
      response.payload.latest_turn_status_display
  );
  const stats = asRecord(display.diff_stats);
  const additions = asNumber(stats.additions);
  const deletions = asNumber(stats.deletions);
  if (!work && (additions !== undefined || deletions !== undefined)) {
    work = `+${additions ?? 0} / -${deletions ?? 0}`;
  }
  return {
    commands: [...new Set(commands)],
    diff,
    files: [...new Set(files)],
    status: asString(assistant.turn_status) ?? asString(diffTurn.turn_status),
    texts: [...new Set(texts)],
    thinking,
    work,
  };
};

export const isCodexTaskDone = (snapshot: CodexTaskSnapshot): boolean => {
  const status = snapshot.status?.toLowerCase() ?? "";
  if (snapshot.error) {
    return true;
  }
  if (status.length === 0) {
    return Boolean(snapshot.diff || snapshot.texts.length > 0);
  }
  return [
    "completed",
    "complete",
    "success",
    "failed",
    "error",
    "cancelled",
  ].some((value) => status.includes(value));
};

export const summarizeDiff = (
  diff: string
): { additions: number; deletions: number; files: string[] } => {
  const files: string[] = [];
  let additions = 0;
  let deletions = 0;
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const parts = line.split(" ");
      const path = parts.at(-1)?.replace(/^b\//u, "");
      if (path) {
        files.push(path);
      }
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      additions += 1;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      deletions += 1;
    }
  }
  return { additions, deletions, files };
};
