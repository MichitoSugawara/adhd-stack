"use client";

import Link from "next/link";

import { StatusChip } from "@/components/screens/status-chip";
import type { ChangeSummary } from "@/lib/chat-view";
import {
  ENV_LABEL,
  ENV_STATUS,
  PREVIEW_UNAVAILABLE,
  STAGING_UNAVAILABLE,
} from "@/lib/env-labels";

interface ProductionChip {
  status: string;
  tone: "idle" | "ok" | "wait";
}

const productionChip = (
  pagesUrl: string | null,
  waiting: boolean
): ProductionChip => {
  if (waiting) {
    return { status: ENV_STATUS.working, tone: "wait" };
  }
  if (pagesUrl) {
    return { status: ENV_STATUS.published, tone: "ok" };
  }
  return { status: ENV_STATUS.unpublished, tone: "idle" };
};

const EnvRow = ({
  href,
  status,
  title,
  tone,
}: {
  href: string;
  status: string;
  title: string;
  tone: "idle" | "ok" | "wait";
}) => (
  <Link
    className="hover:bg-hover rounded-card flex items-center justify-between gap-2 px-2.5 py-2"
    href={href}
  >
    <span className="text-[13px] font-medium">{title}</span>
    <StatusChip tone={tone}>{status}</StatusChip>
  </Link>
);

export const EditorEnvRail = ({
  changes,
  envsHref,
  name,
  onNewPreview,
  pagesUrl,
  waiting,
}: {
  changes: ChangeSummary;
  envsHref: string;
  name: string;
  onNewPreview: () => void;
  pagesUrl: string | null;
  waiting: boolean;
}) => {
  const production = productionChip(pagesUrl, waiting);

  return (
    <aside className="border-line flex w-full shrink-0 flex-col gap-4 overflow-auto border-b p-4 lg:w-56 lg:border-r lg:border-b-0">
      <div>
        <p className="text-ink-3 text-[11px] tracking-[0.08em] uppercase">
          アプリ
        </p>
        <p className="mt-1 text-[14px] font-semibold">{name}</p>
      </div>
      <div>
        <p className="text-ink-3 mb-1 text-[11px] tracking-[0.08em] uppercase">
          環境
        </p>
        <div className="flex flex-col gap-1">
          <EnvRow
            href={envsHref}
            status={ENV_STATUS.none}
            title={ENV_LABEL.preview}
            tone="idle"
          />
          <EnvRow
            href={envsHref}
            status={ENV_STATUS.none}
            title={ENV_LABEL.staging}
            tone="idle"
          />
          <EnvRow
            href={envsHref}
            status={production.status}
            title={ENV_LABEL.production}
            tone={production.tone}
          />
        </div>
      </div>
      <div>
        <p className="text-ink-3 mb-1 text-[11px] tracking-[0.08em] uppercase">
          プレビュー
        </p>
        <p className="text-ink-3 text-[12px] leading-5">
          {PREVIEW_UNAVAILABLE}
        </p>
        <button
          className="rounded-control bg-field text-ink mt-2 h-8 w-full px-3 text-[12px] font-medium"
          onClick={onNewPreview}
          type="button"
        >
          ＋新しいプレビュー
        </button>
      </div>
      <div>
        <p className="text-ink-3 mb-1 text-[11px] tracking-[0.08em] uppercase">
          変更
        </p>
        {changes.files.length === 0 ? (
          <p className="text-ink-3 text-[12px] leading-5">
            まだまとまった変更はありません。
          </p>
        ) : (
          <p className="text-ink-2 text-[12px] leading-5">
            {String(changes.files.length)} ファイル
            {changes.add + changes.del > 0
              ? ` · +${String(changes.add)} / -${String(changes.del)}`
              : ""}
          </p>
        )}
        <p className="text-ink-3 mt-2 text-[12px] leading-5">
          {STAGING_UNAVAILABLE}
        </p>
      </div>
    </aside>
  );
};
