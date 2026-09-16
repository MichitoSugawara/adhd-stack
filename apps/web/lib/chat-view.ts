export interface ChatMessage {
  _id: string;
  body: string;
  kind: "command" | "diff" | "text" | "thinking" | "work";
  meta?: {
    additions?: number;
    command?: string;
    deletions?: number;
    files?: string[];
  };
  role: "assistant" | "system" | "user";
}

export interface ChatToolStep {
  chip: string;
  detail: { text: string }[];
  detailMono: boolean;
  icon: string;
  label: string;
  mono: boolean;
}

export interface ChatToolDiff {
  add: number;
  del: number;
  file: string;
}

export type ChatViewItem =
  | { body: string; id: string; type: "system" | "text" | "user" | "work" }
  | { active: boolean; body: string; id: string; type: "thinking" }
  | {
      diffs: ChatToolDiff[];
      id: string;
      steps: ChatToolStep[];
      type: "tools";
    };

const toolStep = (message: ChatMessage): ChatToolStep => {
  if (message.kind === "command") {
    const command = message.meta?.command ?? message.body;
    return {
      chip: command,
      detail: [{ text: message.body }],
      detailMono: true,
      icon: "run",
      label: "コマンド",
      mono: true,
    };
  }
  if (message.kind === "diff") {
    const file = message.meta?.files?.[0] ?? "変更";
    return {
      chip: file,
      detail: [{ text: message.body }],
      detailMono: true,
      icon: "write",
      label: "差分",
      mono: true,
    };
  }
  return {
    chip: message.body.slice(0, 48),
    detail: [{ text: message.body }],
    detailMono: false,
    icon: "think",
    label: "作業",
    mono: false,
  };
};

const toolDiff = (message: ChatMessage): ChatToolDiff | undefined => {
  if (message.kind !== "diff") {
    return undefined;
  }
  const file = message.meta?.files?.[0] ?? "変更";
  return {
    add: message.meta?.additions ?? 0,
    del: message.meta?.deletions ?? 0,
    file,
  };
};

const hasLaterAssistantText = (
  messages: readonly ChatMessage[],
  index: number
): boolean =>
  messages
    .slice(index + 1)
    .some((message) => message.role === "assistant" && message.kind === "text");

export const toChatView = (
  messages: readonly ChatMessage[]
): ChatViewItem[] => {
  const items: ChatViewItem[] = [];
  let toolMessages: ChatMessage[] = [];
  const flushTools = () => {
    if (toolMessages.length === 0) {
      return;
    }
    const [first] = toolMessages;
    if (!first) {
      toolMessages = [];
      return;
    }
    items.push({
      diffs: toolMessages
        .map((message) => toolDiff(message))
        .filter((row): row is ChatToolDiff => row !== undefined),
      id: first._id,
      steps: toolMessages.map((message) => toolStep(message)),
      type: "tools",
    });
    toolMessages = [];
  };

  for (const [index, message] of messages.entries()) {
    if (!message) {
      continue;
    }
    if (message.role === "user") {
      flushTools();
      items.push({ body: message.body, id: message._id, type: "user" });
      continue;
    }
    if (message.role === "system") {
      flushTools();
      items.push({ body: message.body, id: message._id, type: "system" });
      continue;
    }
    if (message.kind === "thinking") {
      flushTools();
      items.push({
        active: !hasLaterAssistantText(messages, index),
        body: message.body,
        id: message._id,
        type: "thinking",
      });
      continue;
    }
    if (message.kind === "text") {
      flushTools();
      items.push({ body: message.body, id: message._id, type: "text" });
      continue;
    }
    toolMessages.push(message);
  }
  flushTools();
  return items;
};

export interface ChangeSummary {
  add: number;
  del: number;
  files: string[];
}

export const changeSummaryFromView = (
  view: readonly ChatViewItem[]
): ChangeSummary => {
  const seen = new Set<string>();
  const files: string[] = [];
  let add = 0;
  let del = 0;
  for (const item of view) {
    if (item.type !== "tools") {
      continue;
    }
    for (const diff of item.diffs) {
      if (!seen.has(diff.file)) {
        seen.add(diff.file);
        files.push(diff.file);
      }
      add += diff.add;
      del += diff.del;
    }
  }
  return { add, del, files };
};
