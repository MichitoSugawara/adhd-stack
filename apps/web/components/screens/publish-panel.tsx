"use client";

import Link from "next/link";

import LoadingState from "@/components/primitives/LoadingState";
import { StatusChip } from "@/components/screens/status-chip";
import { UrlChip } from "@/components/screens/url-chip";
import { WorkspaceIcon } from "@/components/shell/workspace-icon";
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
      <span className="bg-green text-page flex size-5 shrink-0 items-center justify-center rounded-full">
        <WorkspaceIcon name="check" size={12} />
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
      <span className="bg-red text-page flex size-5 shrink-0 items-center justify-center rounded-full">
        <svg
          aria-hidden="true"
          fill="none"
          height="12"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="12"
        >
          <path d="M12 5v8m0 5v1" />
        </svg>
      </span>
    );
  }
  return <span className="border-line size-5 shrink-0 rounded-full border" />;
};

const PublishRecovery = ({
  href = "/connect",
  label = "接続を確認する",
}: {
  href?: string;
  label?: string;
}) => (
  <Link className="ui-button-primary" href={href}>
    {label}
  </Link>
);

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
  canPublish = true,
  recoveryHref,
  recoveryLabel,
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
  canPublish?: boolean;
  recoveryHref?: string;
  recoveryLabel?: string;
}) => {
  const pages = publicHttpUrl(pagesUrl);
  const convex = publicHttpUrl(convexUrl);
  const shownNotes = notes ?? [];
  const inFlight = waiting ?? pending;
  const showFunctionGap =
    convex !== null && !hasFunctionPushOutcome(shownNotes);
  const waitLabel = pending ? "反映しています" : "ページを組み立てています";
  const phase = publishPhase(pending, inFlight, pagesDeployStatus);
  const steps = publishStepRows(phase);
  const infoNotes = shownNotes.filter((note) => isPublishInfoNote(note));
  const otherNotes = shownNotes.filter((note) => !isPublishInfoNote(note));
  let publishLabel = phase === "done" ? "本番を更新する" : "本番へ公開する";
  if (inFlight) {
    publishLabel = "公開の完了を待っています…";
  }

  return (
    <section className="studio-publish-panel">
      <div className="studio-publish-heading">
        <h2>{phaseTitle(phase)}</h2>
        <StatusChip tone={chipTone(phase)}>{phaseChip(phase)}</StatusChip>
      </div>
      <p className="studio-publish-description">
        アプリとデータを、接続している公開先に反映します。公開が完了すると、あなたの
        URL から使えます。
      </p>
      {inFlight ? (
        <div className="mt-4">
          <LoadingState label={waitLabel} variant="Drive" />
          <p className="text-ink-2 mt-2 text-[13px] leading-6">
            アプリとデータの更新を待っています。完了すると状態が切り替わります。
          </p>
        </div>
      ) : null}
      <ol className="studio-publish-steps">
        {steps.map((step) => (
          <li key={step.key}>
            <StepMark state={step.state} />
            <div>
              <strong>{step.label}</strong>
              <small>{step.detail}</small>
            </div>
          </li>
        ))}
      </ol>
      <div className="studio-publish-urls">
        {pages ? (
          <UrlChip href={pages} waiting={inFlight && phase !== "done"} />
        ) : (
          <p className="text-ink-3 text-[12px]">
            公開先の URL はまだありません
          </p>
        )}
        {convex ? <UrlChip href={convex} /> : null}
      </div>
      <div className="studio-publish-actions">
        {canPublish ? (
          <button
            className="ui-button-primary"
            disabled={pending || inFlight}
            onClick={onPublish}
            type="button"
          >
            {publishLabel}
          </button>
        ) : (
          <PublishRecovery href={recoveryHref} label={recoveryLabel} />
        )}
      </div>
      {phase === "done" && pages ? (
        <div className="studio-publish-actions">
          <a
            className="ui-button"
            href={pages}
            rel="noreferrer"
            target="_blank"
          >
            本番を開く
          </a>
          {editorHref ? (
            <Link className="ui-button" href={editorHref}>
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
      {error ? (
        <p className="studio-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
};
