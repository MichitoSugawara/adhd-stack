"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import LoadingState from "@/components/primitives/LoadingState";
import TaskRows from "@/components/primitives/TaskRows";
import type { TaskRow } from "@/components/primitives/TaskRows";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { connectErrorMessage } from "@/lib/connect-error";
import { useRetryProvision, useWorkspaceBySlug } from "@/lib/coding-port";
import { hasConvexUrl } from "@/lib/env";
import { useShell } from "@/lib/shell-state";

const STEPS = [
  { key: "repo", label: "GitHub リポジトリ", meta: "名前付き" },
  { key: "template", label: "tahcode 由来テンプレート", meta: "足場" },
  { key: "backend", label: "実行環境", meta: "CodingBackend" },
  { key: "pages", label: "Cloudflare Pages", meta: "公開先" },
  { key: "convex", label: "Convex", meta: "データ" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const rowsForTick = (tick: number): TaskRow[] => {
  const visibleCount = Math.min(tick + 1, STEPS.length);
  const rows: TaskRow[] = [];
  for (let index = 0; index < visibleCount; index += 1) {
    const step = STEPS[index];
    if (step === undefined) {
      continue;
    }
    rows.push({
      amount: step.meta,
      details: [{ label: step.label, meta: step.meta }],
      key: step.key,
      label: step.label,
      status: index < tick ? "done" : "running",
      step: index + 1,
    });
  }
  return rows;
};

const statusOf = (
  value: string | undefined
): TaskRow["status"] => {
  if (value === "done") {
    return "done";
  }
  if (value === "error") {
    return "failed";
  }
  if (value === "running") {
    return "running";
  }
  return "running";
};

const rowsFromSteps = (
  steps:
    | {
        backend: string;
        convex: string;
        pages: string;
        repo: string;
        template: string;
      }
    | undefined,
  provisionStatus: string
): TaskRow[] => {
  const values: Record<StepKey, string> = {
    backend: steps?.backend ?? (provisionStatus === "pending" ? "pending" : "running"),
    convex: steps?.convex ?? "pending",
    pages: steps?.pages ?? "pending",
    repo: steps?.repo ?? "pending",
    template: steps?.template ?? "pending",
  };
  return STEPS.map((step, index) => ({
    amount: values[step.key] === "pending" ? "待ち" : step.meta,
    details: [{ label: step.label, meta: values[step.key] }],
    key: step.key,
    label: step.label,
    status:
      values[step.key] === "pending" && provisionStatus === "pending"
        ? "running"
        : values[step.key] === "skipped"
          ? "done"
          : statusOf(values[step.key]),
    step: index + 1,
  }));
};

const CreatingLive = ({ slug }: { slug: string }) => {
  const workspace = useWorkspaceBySlug(slug);
  const retry = useRetryProvision();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (workspace === undefined) {
    return (
      <main className="px-8 py-10">
        <p className="text-ink-2 text-[14px]">読み込んでいます…</p>
      </main>
    );
  }
  if (workspace === null) {
    return (
      <main className="px-8 py-10">
        <h1 className="text-[24px] font-semibold">アプリが見つかりません</h1>
      </main>
    );
  }

  const complete = workspace.provisionStatus === "ready";
  const failed = workspace.provisionStatus === "error";

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6 lg:px-10">
      <div>
        <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
          作成中
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
          {workspace.name} をつくっています
        </h1>
        <p className="text-ink-2 mt-2 text-[14px]">
          GitHub リポジトリ、tahcode 由来の足場、実行環境の進捗です。
        </p>
      </div>
      {workspace.provisionStatus === "provisioning" ? (
        <LoadingState label="用意しています" variant="Drive" />
      ) : null}
      <TaskRows
        className="max-w-xl"
        labels={{ completed: "済", failed: "失敗" }}
        rows={rowsFromSteps(workspace.provisionSteps, workspace.provisionStatus)}
        variant="List"
      />
      {workspace.provisionError ? (
        <p className="text-red max-w-2xl text-[13px]">{workspace.provisionError}</p>
      ) : null}
      {error ? <p className="text-red max-w-2xl text-[13px]">{error}</p> : null}
      {complete ? (
        <Link
          className="rounded-control bg-ink text-surface h-10 w-fit px-4 text-[13px] leading-10 font-medium"
          href={`/p/${slug}`}
        >
          エディタを開く
        </Link>
      ) : null}
      {failed ? (
        <button
          className="rounded-control bg-ink text-surface h-10 w-fit px-4 text-[13px] font-medium disabled:opacity-40"
          disabled={retrying}
          onClick={() => {
            setRetrying(true);
            setError(null);
            void retry({ slug })
              .catch((caught: unknown) => {
                setError(connectErrorMessage(caught));
              })
              .finally(() => {
                setRetrying(false);
              });
          }}
          type="button"
        >
          もう一度試す
        </button>
      ) : null}
    </main>
  );
};

const CreatingSkeleton = ({ appId }: { appId: string }) => {
  const { hydrated, setAppStep, state } = useShell();
  const [tick, setTick] = useState(0);
  const app = state.apps.find((item) => item.id === appId);
  const complete = tick >= STEPS.length;

  useEffect(() => {
    if (!hydrated || !state.entered) {
      return;
    }
    if (tick >= STEPS.length) {
      setAppStep(appId, STEPS.length);
      return;
    }
    setAppStep(appId, tick);
    const timer = window.setTimeout(() => {
      setTick((current) => current + 1);
    }, 900);
    return () => {
      window.clearTimeout(timer);
    };
  }, [appId, hydrated, setAppStep, state.entered, tick]);

  return hydrated && !app ? (
    <main className="px-8 py-10">
      <h1 className="text-[24px] font-semibold">アプリが見つかりません</h1>
    </main>
  ) : (
    <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6 lg:px-10">
      <div>
        <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
          作成中
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
          {app?.name ?? appId} をつくっています
        </h1>
        <p className="text-ink-2 mt-2 text-[14px]">
          Convex 未設定です。進捗の見た目だけで、リポジトリも環境も作りません。
        </p>
      </div>
      <LoadingState label="用意しています" variant="Drive" />
      <TaskRows
        className="max-w-xl"
        labels={{ completed: "済", failed: "失敗" }}
        rows={rowsForTick(tick)}
        variant="List"
      />
      {complete ? (
        <Link
          className="rounded-control bg-ink text-surface h-10 w-fit px-4 text-[13px] leading-10 font-medium"
          href={`/p/${appId}`}
        >
          エディタを開く
        </Link>
      ) : null}
    </main>
  );
};

export const CreatingScreen = ({ appId }: { appId: string }) => {
  const live = hasConvexUrl();
  return (
    <ShellGate>
      <AppFrame>
        {live ? <CreatingLive slug={appId} /> : <CreatingSkeleton appId={appId} />}
      </AppFrame>
    </ShellGate>
  );
};
