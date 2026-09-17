import type { ReactNode } from "react";

import { StatusChip } from "@/components/screens/status-chip";
import { UrlChip } from "@/components/screens/url-chip";

type EnvTone = "idle" | "ok" | "wait";

export const EnvCard = ({
  actions,
  body,
  number,
  status,
  title,
  tone,
  url,
}: {
  actions?: ReactNode;
  body: string;
  number?: string;
  status: string;
  title: string;
  tone: EnvTone;
  url?: string | null;
}) => (
  <article className={`studio-env-card${title === "検証" ? " is-muted" : ""}`}>
    {number ? <span className="studio-env-number">{number}</span> : null}
    <div className="studio-env-card-header">
      <h2>{title}</h2>
      <StatusChip tone={tone}>{status}</StatusChip>
    </div>
    <p>{body}</p>
    {url ? (
      <div className="mt-3">
        <UrlChip href={url} />
      </div>
    ) : null}
    {actions ? <div className="studio-env-actions">{actions}</div> : null}
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
