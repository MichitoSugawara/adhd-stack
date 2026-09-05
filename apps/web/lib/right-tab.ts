export type RightTab = "browser" | "changes" | "history" | "source";

const isRightTab = (value: string | null): value is RightTab =>
  value === "browser" ||
  value === "changes" ||
  value === "history" ||
  value === "source";

export const rightTabFrom = (value: string | null): RightTab =>
  isRightTab(value) ? value : "browser";
