"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { useShell } from "@/lib/shell-state";

const ProjectsNewAppButton = ({ onOpen }: { onOpen: () => void }) => {
  const port = useConnectionsPort();
  const blocked = Boolean(port.board && !port.board.allConnected);

  return (
    <button
      className="rounded-control bg-ink text-surface h-10 px-4 text-[13px] font-medium disabled:opacity-40"
      data-new-app
      disabled={blocked}
      onClick={onOpen}
      type="button"
    >
      新しいアプリ
    </button>
  );
};

const ProjectsReadyNote = () => {
  const port = useConnectionsPort();
  if (!port.board) {
    return (
      <p className="shell-note max-w-3xl">
        接続状態を確認しています。一覧はまだブラウザ内の骨格です。
      </p>
    );
  }
  if (port.board.allConnected) {
    return (
      <p className="shell-note max-w-3xl">
        4つの接続は揃っています。作成の実体は次の段階です。いまは名前付きの骨格だけです。
      </p>
    );
  }
  return (
    <p className="shell-note max-w-3xl">
      接続が揃うまで作成は始めません。いまは一覧の骨格だけ見られます。
    </p>
  );
};

export const ProjectsScreen = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shell = useShell();
  const [manualOpen, setManualOpen] = useState(false);
  const [name, setName] = useState("");
  const open = manualOpen || searchParams.get("new") === "1";
  const live = hasConvexUrl();

  const closeDialog = () => {
    setManualOpen(false);
    if (searchParams.get("new") === "1") {
      router.replace("/projects");
    }
  };

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      return;
    }
    const id = shell.createApp(trimmed);
    setManualOpen(false);
    setName("");
    router.push(`/p/${id}/creating`);
  };

  return (
    <ShellGate>
      <AppFrame>
        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
                アプリ
              </p>
              <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
                プロジェクト
              </h1>
              <p className="text-ink-2 mt-2 text-[14px]">
                名前を付けて作ります。固定名はありません。
              </p>
            </div>
            {live ? (
              <ProjectsNewAppButton
                onOpen={() => {
                  setManualOpen(true);
                }}
              />
            ) : (
              <button
                className="rounded-control bg-ink text-surface h-10 px-4 text-[13px] font-medium"
                data-new-app
                onClick={() => {
                  setManualOpen(true);
                }}
                type="button"
              >
                新しいアプリ
              </button>
            )}
          </div>
          {live ? (
            <ProjectsReadyNote />
          ) : (
            <p className="shell-note max-w-3xl">
              一覧はブラウザ内のローカル状態です。GitHub
              上のリポジトリはまだ作りません。
            </p>
          )}
          {shell.state.apps.length === 0 ? (
            <div className="rounded-card bg-surface text-ink-2 shadow-card max-w-xl p-5 text-[14px]">
              まだありません。名前を付けて、作成中の画面を見てください。
            </div>
          ) : (
            <ul className="divide-line rounded-card bg-surface shadow-card max-w-3xl divide-y overflow-hidden">
              {shell.state.apps.map((app) => (
                <li key={app.id}>
                  <button
                    className="hover:bg-hover flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() => {
                      router.push(
                        app.status === "creating"
                          ? `/p/${app.id}/creating`
                          : `/p/${app.id}`
                      );
                    }}
                    type="button"
                  >
                    <span>
                      <span className="block text-[14px] font-medium">
                        {app.name}
                      </span>
                      <span className="text-ink-3 block text-[12px]">
                        {app.id}
                      </span>
                    </span>
                    <span className="rounded-chip bg-field text-ink-3 px-2 py-1 text-[12px]">
                      {app.status === "creating" ? "作成中" : "シェル"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </main>
        {open ? (
          <div className="bg-page/70 fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center">
            <div className="rounded-window bg-surface shadow-overlay w-full max-w-md p-5">
              <h2 className="text-[18px] font-semibold">新しいアプリ</h2>
              <p className="text-ink-2 mt-2 text-[13px]">
                入力した名前が、あとで GitHub リポジトリ名になります。
              </p>
              <label className="mt-4 block">
                <span className="text-ink-3 text-[12px]">名前</span>
                <input
                  autoFocus
                  className="rounded-control bg-field text-ink shadow-inset-field mt-1 h-10 w-full px-3 text-[14px] outline-none"
                  data-app-name
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submit();
                    }
                  }}
                  placeholder="たとえば notes や inbox"
                  value={name}
                />
              </label>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  className="rounded-control text-ink-2 hover:bg-hover h-9 px-3 text-[13px]"
                  onClick={closeDialog}
                  type="button"
                >
                  やめる
                </button>
                <button
                  className="rounded-control bg-ink text-surface h-9 px-3 text-[13px] font-medium disabled:opacity-40"
                  disabled={name.trim().length === 0}
                  onClick={submit}
                  type="button"
                >
                  作って進む
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </AppFrame>
    </ShellGate>
  );
};
