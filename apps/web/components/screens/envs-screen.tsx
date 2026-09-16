"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DisabledAction, EnvCard } from "@/components/screens/env-card";
import { NewPreviewModal, PromoteModal } from "@/components/screens/env-modals";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useWorkspaceBySlug } from "@/lib/coding-port";
import { hasConvexUrl } from "@/lib/env";
import {
  ENV_LABEL,
  ENV_STATUS,
  PREVIEW_UNAVAILABLE,
  ROLLBACK_UNAVAILABLE,
  STAGING_UNAVAILABLE,
} from "@/lib/env-labels";
import { writeLastWorkspace } from "@/lib/last-workspace";
import { publicHttpUrl } from "@/lib/public-url";
import { CONVEX_FUNCTION_PUSH_NOTE } from "@/lib/publish-copy";
import { useShell } from "@/lib/shell-state";

type EnvTone = "idle" | "ok" | "wait";

interface ProductionChip {
  label: string;
  tone: EnvTone;
}

const productionStatus = (
  pagesUrl: string | null,
  started: boolean
): ProductionChip => {
  if (started) {
    return { label: ENV_STATUS.working, tone: "wait" };
  }
  if (pagesUrl) {
    return { label: ENV_STATUS.published, tone: "ok" };
  }
  return { label: ENV_STATUS.unpublished, tone: "idle" };
};

const productionBody = (pages: string | null, started: boolean): string => {
  if (started) {
    return "本番の組み立てを待っています。完了はまだ見ていません。";
  }
  if (pages) {
    return "いま開いている本番です。";
  }
  return "本番はまだ出ていません。";
};

const EnvCards = ({
  onNewPreview,
  onPromote,
  pages,
  production,
  publishHref,
  started,
}: {
  onNewPreview: () => void;
  onPromote: () => void;
  pages: string | null;
  production: ProductionChip;
  publishHref?: string;
  started: boolean;
}) => (
  <div className="mt-6 grid max-w-5xl gap-3 lg:grid-cols-3">
    <EnvCard
      actions={
        <>
          <button
            className="rounded-control bg-field text-ink h-8 px-3 text-[13px] font-medium"
            onClick={onNewPreview}
            type="button"
          >
            ＋新しいプレビュー
          </button>
          <DisabledAction>検証へ送る</DisabledAction>
        </>
      }
      body={PREVIEW_UNAVAILABLE}
      status={ENV_STATUS.none}
      title={ENV_LABEL.preview}
      tone="idle"
    />
    <EnvCard
      actions={
        <>
          <DisabledAction>差を見る</DisabledAction>
          <button
            className="rounded-control bg-field text-ink h-8 px-3 text-[13px] font-medium"
            onClick={onPromote}
            type="button"
          >
            本番へ反映
          </button>
        </>
      }
      body={STAGING_UNAVAILABLE}
      status={ENV_STATUS.none}
      title={ENV_LABEL.staging}
      tone="idle"
    />
    <EnvCard
      actions={
        <>
          {publishHref ? (
            <Link
              className="btn-accent rounded-control inline-flex h-8 items-center px-3 text-[13px] font-medium"
              href={publishHref}
            >
              本番へ反映
            </Link>
          ) : (
            <DisabledAction>本番へ反映</DisabledAction>
          )}
          <DisabledAction>前の版に戻す</DisabledAction>
        </>
      }
      body={productionBody(pages, started)}
      status={production.label}
      title={ENV_LABEL.production}
      tone={production.tone}
      url={pages}
    />
  </div>
);

const EnvsLive = ({ slug }: { slug: string }) => {
  const router = useRouter();
  const workspace = useWorkspaceBySlug(slug);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    writeLastWorkspace({
      name: workspace.name,
      path: `/p/${slug}/envs`,
      slug,
    });
  }, [slug, workspace]);

  if (workspace === undefined) {
    return <p className="text-ink-2 mt-2 text-[14px]">読み込んでいます…</p>;
  }
  if (workspace === null) {
    return (
      <h1 className="mt-2 text-[24px] font-semibold">アプリが見つかりません</h1>
    );
  }
  const pages = publicHttpUrl(workspace.cloudflarePagesUrl);
  const convex = publicHttpUrl(workspace.convexUrl);
  const started = workspace.pagesDeployStatus === "started";
  const production = productionStatus(pages, started);

  return (
    <>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
        {workspace.name}
      </h1>
      <p className="text-ink-2 mt-2 max-w-2xl text-[14px]">
        プレビュー、検証、本番を並べます。無いものはまだです。
      </p>
      <EnvCards
        onNewPreview={() => {
          setPreviewOpen(true);
        }}
        onPromote={() => {
          setPromoteOpen(true);
        }}
        pages={pages}
        production={production}
        publishHref={`/p/${slug}/publish`}
        started={started}
      />
      {convex ? (
        <p className="info-note mt-5 max-w-3xl">{CONVEX_FUNCTION_PUSH_NOTE}</p>
      ) : null}
      {workspace.publishNotes?.map((note) => (
        <p className="info-note mt-2 max-w-3xl" key={note}>
          {note}
        </p>
      ))}
      {workspace.publishError ? (
        <p className="text-red mt-3 max-w-3xl text-[13px]">
          {workspace.publishError}
        </p>
      ) : null}
      <p className="text-ink-3 mt-4 max-w-3xl text-[12px]">
        {ROLLBACK_UNAVAILABLE}
      </p>
      {previewOpen ? (
        <NewPreviewModal
          onClose={() => {
            setPreviewOpen(false);
          }}
        />
      ) : null}
      {promoteOpen ? (
        <PromoteModal
          canPromote={false}
          onClose={() => {
            setPromoteOpen(false);
          }}
          onConfirm={() => {
            router.push(`/p/${slug}/publish`);
          }}
        />
      ) : null}
    </>
  );
};

const EnvsOffline = ({ slug, title }: { slug: string; title: string }) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  return (
    <>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">{title}</h1>
      <p className="text-ink-2 mt-2 max-w-2xl text-[14px]">
        Convex 未設定です。環境の URL は出しません。
      </p>
      <EnvCards
        onNewPreview={() => {
          setPreviewOpen(true);
        }}
        onPromote={() => {
          setPromoteOpen(true);
        }}
        pages={null}
        production={{ label: ENV_STATUS.none, tone: "idle" }}
        publishHref={`/p/${slug}/publish`}
        started={false}
      />
      {previewOpen ? (
        <NewPreviewModal
          onClose={() => {
            setPreviewOpen(false);
          }}
        />
      ) : null}
      {promoteOpen ? (
        <PromoteModal
          canPromote={false}
          onClose={() => {
            setPromoteOpen(false);
          }}
        />
      ) : null}
    </>
  );
};

export const EnvsScreen = ({ appId }: { appId: string }) => {
  const live = hasConvexUrl();
  const shell = useShell();
  const app = shell.state.apps.find((item) => item.id === appId);
  const title = app?.name ?? appId;

  return (
    <ShellGate>
      <AppFrame>
        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-6 lg:px-10">
          <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
            環境
          </p>
          {live ? (
            <EnvsLive slug={appId} />
          ) : (
            <EnvsOffline slug={appId} title={title} />
          )}
          <Link
            className="rounded-control bg-field text-ink h-10 w-fit px-4 text-[13px] leading-10 font-medium"
            href={`/p/${appId}`}
          >
            相談に戻る
          </Link>
        </main>
      </AppFrame>
    </ShellGate>
  );
};
