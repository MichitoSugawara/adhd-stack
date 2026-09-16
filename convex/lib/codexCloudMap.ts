import type { NormalizedTurn } from "./codingEvents";
import { asList, asNumber, asRecord, asString } from "./httpJson";

export type CodexTaskSnapshot = NormalizedTurn;

const CODEX_TURN_DONE = new Set([
  "canceled",
  "cancelled",
  "complete",
  "completed",
  "error",
  "failed",
  "success",
]);

const CODEX_TURN_PENDING = new Set([
  "creating",
  "in_progress",
  "pending",
  "queued",
  "running",
  "started",
  "working",
]);

const normalizeTurnStatus = (status: string): string =>
  status.toLowerCase().replaceAll("-", "_");

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

const collectFromOutputItems = (
  items: unknown[]
): Pick<CodexTaskSnapshot, "commands" | "diff" | "files" | "texts"> => {
  const commands: string[] = [];
  const files: string[] = [];
  const texts: string[] = [];
  let diff: string | undefined;
  for (const item of items) {
    const row = asRecord(item);
    if (asString(row.role) === "user") {
      continue;
    }
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

const thinkingFromWorklog = (worklog: unknown): string[] => {
  const thinking: string[] = [];
  for (const message of asList(asRecord(worklog).messages)) {
    const row = asRecord(message);
    if (asString(asRecord(row.author).role) === "user") {
      continue;
    }
    thinking.push(...textFromContent(asRecord(row.content).parts));
  }
  return thinking;
};

export const codexTaskSnapshotFromPayload = (
  payload: Record<string, unknown>
): CodexTaskSnapshot => {
  const assistant = asRecord(payload.current_assistant_turn);
  const diffTurn = asRecord(payload.current_diff_task_turn);
  const turns = [assistant, diffTurn].filter(
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
    if (status && work === undefined) {
      work = status;
    }
    const collected = collectFromOutputItems(asList(turn.output_items));
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
    thinking.push(...thinkingFromWorklog(turn.worklog));
    const error = asString(asRecord(turn.error).message);
    if (error) {
      return {
        commands: [...new Set(commands)],
        diff,
        error,
        files: [...new Set(files)],
        status:
          asString(assistant.turn_status) ?? asString(diffTurn.turn_status),
        texts: [...new Set(texts)],
        thinking,
        work,
      };
    }
  }
  const display = asRecord(
    assistant.latest_turn_status_display ?? payload.latest_turn_status_display
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

// Cursor Cloud (isCursorRunDone) waits on explicit terminal run status.
// Echoed user text is not a completion signal.
export const isCodexTaskDone = (snapshot: CodexTaskSnapshot): boolean => {
  if (snapshot.error) {
    return true;
  }
  const status = normalizeTurnStatus(snapshot.status ?? "");
  if (status.length === 0 || CODEX_TURN_PENDING.has(status)) {
    return false;
  }
  return CODEX_TURN_DONE.has(status);
};
