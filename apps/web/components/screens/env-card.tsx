import type { ReactNode } from "react";

import { StatusChip } from "@/components/screens/status-chip";
import { UrlChip } from "@/components/screens/url-chip";

type EnvTone = "idle" | "ok" | "wait";

export const EnvCard = ({
  actions,
  body,
  status,
  title,
  tone,
  url,
}: {
  actions?: ReactNode;
  body: string;
  status: string;
  title: string;
  tone: EnvTone;
  url?: string | null;
}) => (
  <article className="rounded-card bg-surface shadow-card flex flex-col p-4">
    <div className="flex items-start justify-between gap-3">
      <h2 className="text-[16px] font-semibold">{title}</h2>
      <StatusChip tone={tone}>{status}</StatusChip>
    </div>
    <p className="text-ink-2 mt-2 text-[13px] leading-6">{body}</p>
    {url ? (
      <div className="mt-3">
        <UrlChip href={url} />
      </div>
    ) : null}
    {actions ? (
      <div className="mt-4 flex flex-wrap gap-2">{actions}</div>
    ) : null}
  </article>
);

export const DisabledAction = ({ children }: { children: string }) => (
  <button
    className="rounded-control bg-field text-ink-3 h-8 px-3 text-[13px] font-medium"
    disabled
    type="button"
  >
    {children}
  </button>
);
