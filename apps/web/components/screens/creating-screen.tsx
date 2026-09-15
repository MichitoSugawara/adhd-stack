"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import LoadingState from "@/components/primitives/LoadingState";
import TaskRows from "@/components/primitives/TaskRows";
import type { TaskRow } from "@/components/primitives/TaskRows";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useShell } from "@/lib/shell-state";

const STEPS = [
  { key: "repo", label: "GitHub リポジトリ", meta: "名前付き" },
  { key: "template", label: "tahcode 由来テンプレート", meta: "足場" },
  { key: "backend", label: "CodingBackend 環境", meta: "v1 は Codex Cloud" },
  { key: "pages", label: "Cloudflare Pages", meta: "公開先" },
  { key: "convex", label: "Convex", meta: "データ" },
] as const;

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

export const CreatingScreen = ({ appId }: { appId: string }) => {
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

  return (
    <ShellGate>
      <AppFrame>
        {hydrated && !app ? (
          <main className="px-8 py-10">
            <h1 className="text-[24px] font-semibold">
              アプリが見つかりません
            </h1>
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
                進捗の見た目です。リポジトリも環境も、まだ本物は作りません。
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
        )}
      </AppFrame>
    </ShellGate>
  );
};
