import { cn } from "@/lib/cn";

type ChipTone = "fail" | "idle" | "ok" | "wait";

const TONE_CLASS = {
  fail: "bg-red-tint text-red",
  idle: "bg-field text-ink-3",
  ok: "bg-green-tint text-green",
  wait: "bg-accent-tint text-accent-ink",
} as const satisfies Record<ChipTone, string>;

export const StatusChip = ({
  children,
  tone,
}: {
  children: string;
  tone: ChipTone;
}) => (
  <span
    className={cn(
      "rounded-chip shrink-0 px-2 py-1 text-[12px] font-medium whitespace-nowrap",
      TONE_CLASS[tone]
    )}
  >
    {children}
  </span>
);
