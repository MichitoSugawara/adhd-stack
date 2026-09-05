export type RightTab = "browser" | "changes" | "consult" | "history" | "source";

const isRightTab = (value: string | null): value is RightTab =>
  value === "browser" ||
  value === "changes" ||
  value === "consult" ||
  value === "history" ||
  value === "source";

export const rightTabFrom = (value: string | null): RightTab =>
  isRightTab(value) ? value : "browser";
