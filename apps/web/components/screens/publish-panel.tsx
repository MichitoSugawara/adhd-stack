"use client";

import Link from "next/link";

import LoadingState from "@/components/primitives/LoadingState";
import { StatusChip } from "@/components/screens/status-chip";
import { UrlChip } from "@/components/screens/url-chip";
import { publicHttpUrl } from "@/lib/public-url";
import type { PagesDeployStatus } from "@/lib/publish-copy";
import {
  CONVEX_FUNCTION_PUSH_NOTE,
  hasFunctionPushOutcome,
  isPublishInfoNote,
} from "@/lib/publish-copy";
import type { PublishStepState } from "@/lib/publish-steps";
import {
  phaseChip,
  phaseTitle,
  publishPhase,
  publishStepRows,
} from "@/lib/publish-steps";

const chipTone = (phase: ReturnType<typeof publishPhase>) => {
  if (phase === "done") {
    return "ok" as const;
  }
  if (phase === "working") {
    return "wait" as const;
  }
  if (phase === "failed") {
    return "fail" as const;
  }
  return "idle" as const;
};

const StepMark = ({ state }: { state: PublishStepState }) => {
  if (state === "done") {
    return (
      <span className="bg-green text-page flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]">
        ✓
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="border-accent size-5 shrink-0 rounded-full border-2 border-t-transparent" />
    );
  }
  if (state === "fail") {
    return (
      <span className="bg-red text-page flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]">
        !
      </span>
    );
  }
  return <span className="border-line size-5 shrink-0 rounded-full border" />;
};

export const PublishPanel = ({
  convexUrl,
  editorHref,
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
  editorHref?: string;
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
  const phase = publishPhase(pending, inFlight, pagesDeployStatus);
  const steps = publishStepRows(phase);
  const infoNotes = shownNotes.filter((note) => isPublishInfoNote(note));
  const otherNotes = shownNotes.filter((note) => !isPublishInfoNote(note));

  return (
    <section className="rounded-card bg-surface shadow-card max-w-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-semibold">{phaseTitle(phase)}</h2>
            <StatusChip tone={chipTone(phase)}>{phaseChip(phase)}</StatusChip>
          </div>
          <p className="text-ink-2 mt-2 text-[13px] leading-6">
            開いているアプリを、つながっている Pages と Convex に出します。
          </p>
        </div>
        {phase === "done" ? null : (
          <button
            className="btn-accent rounded-control h-8 shrink-0 px-3 text-[13px] font-medium disabled:opacity-40"
            disabled={pending}
            onClick={onPublish}
            type="button"
          >
            {pending ? "公開しています…" : "公開する"}
          </button>
        )}
      </div>
      {inFlight ? (
        <div className="mt-4">
          <LoadingState label={waitLabel} variant="Drive" />
          <p className="text-ink-2 mt-2 text-[13px] leading-6">
            関数は Pages ビルドのあとです。終わったことにしません。
          </p>
        </div>
      ) : null}
      <div className="mt-5 flex flex-col gap-3">
        {steps.map((step) => (
          <div className="flex flex-col gap-2" key={step.key}>
            <div className="flex items-center gap-2.5">
              <StepMark state={step.state} />
              <span className="min-w-0 flex-1 text-[13px] font-medium">
                {step.label}
              </span>
              <span className="text-ink-3 text-[12px]">{step.detail}</span>
            </div>
            {step.progress ? (
              <div className="bg-inset ml-8 h-1 overflow-hidden rounded-full">
                <div className="bg-accent h-1 w-2/3 animate-pulse rounded-full" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-2">
        {pages ? (
          <UrlChip href={pages} waiting={inFlight && phase !== "done"} />
        ) : (
          <p className="text-ink-3 text-[13px]">Pages はまだありません</p>
        )}
        {convex ? <UrlChip href={convex} /> : null}
      </div>
      {phase === "done" && pages ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            className="btn-accent rounded-control inline-flex h-9 items-center px-3 text-[13px] font-medium"
            href={pages}
            rel="noreferrer"
            target="_blank"
          >
            公開ページを開く
          </a>
          {editorHref ? (
            <Link
              className="rounded-control bg-field text-ink inline-flex h-9 items-center px-3 text-[13px] font-medium"
              href={editorHref}
            >
              編集に戻る
            </Link>
          ) : null}
        </div>
      ) : null}
      {hint ? <p className="text-ink-2 mt-3 text-[13px]">{hint}</p> : null}
      {showFunctionGap ? (
        <p className="info-note mt-3">{CONVEX_FUNCTION_PUSH_NOTE}</p>
      ) : null}
      {infoNotes.map((note) => (
        <p className="info-note mt-2" key={note}>
          {note}
        </p>
      ))}
      {otherNotes.map((note) => (
        <p className="text-ink-2 mt-2 text-[13px]" key={note}>
          {note}
        </p>
      ))}
      {error ? <p className="text-red mt-3 text-[13px]">{error}</p> : null}
    </section>
  );
};
