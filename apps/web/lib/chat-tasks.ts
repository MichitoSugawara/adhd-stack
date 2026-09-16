import type { TaskRow } from "@/components/primitives/TaskRows";
import type { ChatViewItem } from "@/lib/chat-view";

const thinkingLines = (body: string): string[] =>
  body
    .split("\n")
    .filter((line) => line.length > 0)
    .slice(0, 8);

const thinkingStatus = (
  active: boolean,
  index: number,
  total: number
): TaskRow["status"] => {
  if (!active) {
    return "done";
  }
  if (total <= 1) {
    return "running";
  }
  if (index === total - 1) {
    return "waiting";
  }
  if (index === total - 2) {
    return "running";
  }
  return "done";
};

const amountFor = (status: TaskRow["status"]): string => {
  if (status === "running") {
    return "処理中";
  }
  if (status === "waiting") {
    return "待機";
  }
  if (status === "failed") {
    return "失敗";
  }
  return "完了";
};

export const taskRowsFromThinking = (
  item: Extract<ChatViewItem, { type: "thinking" }>
): TaskRow[] => {
  const lines = thinkingLines(item.body);
  if (lines.length === 0) {
    const status = item.active ? "running" : "done";
    return [
      {
        amount: amountFor(status),
        details: [],
        key: item.id,
        label: item.active ? "考えています" : "思考",
        status,
      },
    ];
  }
  return lines.map((line, index) => {
    const status = thinkingStatus(item.active, index, lines.length);
    return {
      amount: amountFor(status),
      details: [],
      key: `${item.id}-${String(index)}`,
      label: line,
      status,
    };
  });
};

export const taskRowsFromTools = (
  item: Extract<ChatViewItem, { type: "tools" }>,
  settled: boolean
): TaskRow[] =>
  item.steps.map((step, index) => {
    const last = index === item.steps.length - 1;
    let status: TaskRow["status"] = "done";
    if (!settled && last) {
      status = "running";
    }
    return {
      amount: amountFor(status),
      details: step.detail.map((line) => ({
        label: line.text,
        meta: step.chip,
      })),
      key: `${item.id}-${String(index)}`,
      label: step.label,
      status,
    };
  });

export const laterSettlesTools = (
  items: readonly ChatViewItem[],
  index: number
): boolean =>
  items
    .slice(index + 1)
    .some((row) => row.type === "text" || row.type === "user");
