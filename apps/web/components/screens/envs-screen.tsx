"use client";

import Link from "next/link";

import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useShell } from "@/lib/shell-state";

export const EnvsScreen = ({ appId }: { appId: string }) => {
  const shell = useShell();
  const app = shell.state.apps.find((item) => item.id === appId);

  return (
    <ShellGate>
      <AppFrame>
        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-6 lg:px-10">
          <div>
            <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
              環境
            </p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
              {app?.name ?? appId}
            </h1>
          </div>
          <p className="shell-note max-w-2xl">
            v1 の公開は一本です。プレビュー / 検証 / 本番の多環境は
            post-v1（tahcode
            テンプレートでタダなら後で出す）。これはスタブです。
          </p>
          <Link
            className="rounded-control bg-ink text-surface h-10 w-fit px-4 text-[13px] leading-10 font-medium"
            href={`/p/${appId}`}
          >
            チャットへ戻る
          </Link>
        </main>
      </AppFrame>
    </ShellGate>
  );
};
