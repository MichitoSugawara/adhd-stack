"use client";

import LoadingState from "@/components/primitives/LoadingState";
import { publicHttpUrl } from "@/lib/public-url";
import type { PagesDeployStatus } from "@/lib/publish-copy";
import {
  CONVEX_FUNCTION_PUSH_NOTE,
  hasFunctionPushOutcome,
} from "@/lib/publish-copy";

const UrlRow = ({
  href,
  label,
  waiting,
}: {
  href: string | null;
  label: string;
  waiting?: boolean;
}) => (
  <p className="text-[13px] leading-6">
    <span className="text-ink-3">{label}</span>
    {href ? (
      <a
        className="text-ink ml-2 break-all underline underline-offset-2"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {href}
      </a>
    ) : (
      <span className="text-ink-2 ml-2">まだありません</span>
    )}
    {waiting && href ? (
      <span className="text-ink-3 ml-2">完了はまだ見ていません</span>
    ) : null}
  </p>
);

const statusLabel = (
  pending: boolean,
  waiting: boolean,
  status?: PagesDeployStatus | null
): string => {
  if (pending) {
    return "作業中";
  }
  if (status === "failure") {
    return "失敗";
  }
  if (status === "success") {
    return "Pages 完了";
  }
  if (waiting) {
    return "ビルド中";
  }
  return "公開";
};

export const PublishPanel = ({
  convexUrl,
  error,
  hint,
  notes,
  onPublish,
  pagesDeployStatus,
  pagesUrl,
  pending,
  waiting,
}: {
  convexUrl?: string | null;
  error?: string | null;
  hint?: string | null;
  notes?: readonly string[];
  onPublish: () => void;
  pagesDeployStatus?: PagesDeployStatus | null;
  pagesUrl?: string | null;
  pending: boolean;
  waiting?: boolean;
}) => {
  const pages = publicHttpUrl(pagesUrl);
  const convex = publicHttpUrl(convexUrl);
  const shownNotes = notes ?? [];
  const inFlight = waiting ?? pending;
  const showFunctionGap =
    convex !== null && !hasFunctionPushOutcome(shownNotes);
  const waitLabel = pending ? "公開しています" : "Pages をビルドしています";

  return (
    <section className="rounded-card bg-surface shadow-card max-w-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-ink-3 text-[12px]">公開</p>
            <span className="rounded-chip bg-field text-ink-3 px-2 py-1 text-[12px] font-medium">
              {statusLabel(pending, inFlight, pagesDeployStatus)}
            </span>
          </div>
          <p className="text-ink-2 mt-2 text-[13px] leading-6">
            開いているアプリを、つながっている Pages と Convex に出します。
          </p>
        </div>
        <button
          className="rounded-control bg-ink text-surface h-8 shrink-0 px-3 text-[13px] font-medium disabled:opacity-40"
          disabled={pending}
          onClick={onPublish}
          type="button"
        >
          {pending ? "公開しています…" : "公開する"}
        </button>
      </div>
      {inFlight ? (
        <div className="mt-4">
          <LoadingState label={waitLabel} variant="Drive" />
          <p className="text-ink-2 mt-2 text-[13px] leading-6">
            関数は Pages ビルドのあとです。終わったことにしません。
          </p>
        </div>
      ) : null}
      <div className="mt-4 flex flex-col gap-1">
        <UrlRow href={pages} label="Pages" waiting={inFlight} />
        <UrlRow href={convex} label="Convex" />
      </div>
      {hint ? <p className="text-ink-2 mt-3 text-[13px]">{hint}</p> : null}
      {showFunctionGap ? (
        <p className="text-ink-2 mt-3 text-[13px]">
          {CONVEX_FUNCTION_PUSH_NOTE}
        </p>
      ) : null}
      {shownNotes.map((note) => (
        <p className="text-ink-2 mt-2 text-[13px]" key={note}>
          {note}
        </p>
      ))}
      {error ? <p className="text-red mt-3 text-[13px]">{error}</p> : null}
    </section>
  );
};
