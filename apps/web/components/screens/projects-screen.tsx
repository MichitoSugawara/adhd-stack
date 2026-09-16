"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useCreateNamedApp, useWorkspaceList } from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { useShell } from "@/lib/shell-state";

const statusLabel = (status: string): string => {
  if (status === "ready") {
    return "準備完了";
  }
  if (status === "error") {
    return "失敗";
  }
  if (status === "provisioning") {
    return "作成中";
  }
  return "待ち";
};

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
    return <p className="shell-note max-w-3xl">接続を確認しています。</p>;
  }
  if (port.board.allConnected) {
    return (
      <p className="shell-note max-w-3xl">
        4つそろっています。名前を付けると、保存先と実行環境を作ります。
      </p>
    );
  }
  return (
    <p className="shell-note max-w-3xl">接続がそろうまで、作成は始めません。</p>
  );
};

const CreateDialog = ({
  name,
  onClose,
  onName,
  onSubmit,
  pending,
}: {
  name: string;
  onClose: () => void;
  onName: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) => (
  <div className="bg-page/70 fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center">
    <div className="rounded-window bg-surface shadow-overlay w-full max-w-md p-5">
      <h2 className="text-[18px] font-semibold">新しいアプリ</h2>
      <p className="text-ink-2 mt-2 text-[13px]">
        入力した名前が、保存先の名前になります。固定名はありません。
      </p>
      <label className="mt-4 block">
        <span className="text-ink-3 text-[12px]">名前</span>
        <input
          autoFocus
          className="rounded-control bg-field text-ink shadow-inset-field mt-1 h-10 w-full px-3 text-[14px] outline-none"
          data-app-name
          onChange={(event) => {
            onName(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder="たとえば notes や inbox"
          value={name}
        />
      </label>
      <div className="mt-5 flex justify-end gap-2">
        <button
          className="rounded-control text-ink-2 hover:bg-hover h-9 px-3 text-[13px]"
          onClick={onClose}
          type="button"
        >
          やめる
        </button>
        <button
          className="rounded-control bg-ink text-surface h-9 px-3 text-[13px] font-medium disabled:opacity-40"
          disabled={name.trim().length === 0 || pending}
          onClick={onSubmit}
          type="button"
        >
          作って進む
        </button>
      </div>
    </div>
  </div>
);

const ProjectsLive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apps = useWorkspaceList();
  const createApp = useCreateNamedApp();
  const [manualOpen, setManualOpen] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [failNote, setFailNote] = useState<string | null>(null);
  const open = manualOpen || searchParams.get("new") === "1";

  const closeDialog = () => {
    setManualOpen(false);
    if (searchParams.get("new") === "1") {
      router.replace("/projects");
    }
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || pending) {
      return;
    }
    setPending(true);
    setFailNote(null);
    try {
      const created = await createApp({ name: trimmed });
      setManualOpen(false);
      setName("");
      router.push(`/p/${created.slug}/creating`);
    } catch (error) {
      setFailNote(connectErrorMessage(error));
    } finally {
      setPending(false);
    }
  };

  let listBody: ReactNode = (
    <p className="text-ink-2 text-[14px]">読み込んでいます…</p>
  );
  if (apps !== undefined && apps.length === 0) {
    listBody = (
      <div className="rounded-card bg-surface text-ink-2 shadow-card max-w-xl p-5 text-[14px]">
        まだありません。名前を付けて作成してください。
      </div>
    );
  } else if (apps !== undefined) {
    listBody = (
      <ul className="divide-line rounded-card bg-surface shadow-card max-w-3xl divide-y overflow-hidden">
        {apps.map((app) => (
          <li key={app._id}>
            <button
              className="hover:bg-hover flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => {
                router.push(
                  app.provisionStatus === "ready"
                    ? `/p/${app.slug}`
                    : `/p/${app.slug}/creating`
                );
              }}
              type="button"
            >
              <span>
                <span className="block text-[14px] font-medium">
                  {app.name}
                </span>
                <span className="text-ink-3 block text-[12px]">{app.slug}</span>
              </span>
              <span className="rounded-chip bg-field text-ink-3 px-2 py-1 text-[12px]">
                {statusLabel(app.provisionStatus)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
            アプリ
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
            一覧
          </h1>
          <p className="text-ink-2 mt-2 text-[14px]">
            名前を付けて作ります。固定名はありません。
          </p>
        </div>
        <ProjectsNewAppButton
          onOpen={() => {
            setManualOpen(true);
          }}
        />
      </div>
      <ProjectsReadyNote />
      {failNote ? (
        <p className="text-red max-w-3xl text-[13px]">{failNote}</p>
      ) : null}
      {listBody}
      {open ? (
        <CreateDialog
          name={name}
          onClose={closeDialog}
          onName={setName}
          onSubmit={() => {
            void submit();
          }}
          pending={pending}
        />
      ) : null}
    </>
  );
};

const ProjectsSkeleton = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shell = useShell();
  const [manualOpen, setManualOpen] = useState(false);
  const [name, setName] = useState("");
  const open = manualOpen || searchParams.get("new") === "1";

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
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
            アプリ
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
            一覧
          </h1>
          <p className="text-ink-2 mt-2 text-[14px]">
            名前を付けて作ります。固定名はありません。
          </p>
        </div>
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
      </div>
      <p className="shell-note max-w-3xl">
        Convex 未設定です。一覧はブラウザ内の見た目だけで、保存先は作りません。
      </p>
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
                  <span className="text-ink-3 block text-[12px]">{app.id}</span>
                </span>
                <span className="rounded-chip bg-field text-ink-3 px-2 py-1 text-[12px]">
                  {app.status === "creating" ? "作成中" : "シェル"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open ? (
        <CreateDialog
          name={name}
          onClose={closeDialog}
          onName={setName}
          onSubmit={submit}
          pending={false}
        />
      ) : null}
    </>
  );
};

export const ProjectsScreen = () => {
  const live = hasConvexUrl();
  return (
    <ShellGate>
      <AppFrame>
        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6 lg:px-10">
          {live ? <ProjectsLive /> : <ProjectsSkeleton />}
        </main>
      </AppFrame>
    </ShellGate>
  );
};
