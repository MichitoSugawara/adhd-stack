"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useCreateNamedApp, useWorkspaceList } from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { relativeFrom } from "@/lib/relative-time";
import { useShell } from "@/lib/shell-state";

/* ─────────────────────────────────────────────────────────
 * NEW HOME
 * The front door: one question, one input. Naming an app
 * is the only decision here — everything else happens on
 * the creating/editor screens.
 * ───────────────────────────────────────────────────────── */

const NAME_IDEAS = ["メモ帳", "日記", "タスク一覧"];

interface Recent {
  href: string;
  name: string;
  note: string;
}

const NameComposer = ({
  disabled,
  name,
  onName,
  onSubmit,
  pending,
}: {
  disabled: boolean;
  name: string;
  onName: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
}) => {
  const canSend = !disabled && !pending && name.trim().length > 0;
  return (
    <div className="border-line bg-surface shadow-card focus-within:ring-accent-tint flex items-center gap-2 rounded-[22px] border p-2 pl-5 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--line-strong)] focus-within:ring-4">
      <input
        aria-label="アプリの名前"
        className="text-ink placeholder:text-ink-3 h-10 min-w-0 flex-1 bg-transparent text-[16px] outline-none"
        autoFocus
        disabled={disabled || pending}
        onChange={(event) => {
          onName(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="アプリの名前を入れる"
        value={name}
      />
      <button
        aria-label="作成"
        className="bg-ink text-surface enabled:hover:bg-ink/90 flex size-10 shrink-0 items-center justify-center rounded-full transition-[transform,opacity,background-color] duration-150 enabled:active:scale-95 disabled:opacity-30"
        disabled={!canSend}
        onClick={onSubmit}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
          width="16"
        >
          <path d="M12 19V5m-6 6 6-6 6 6" />
        </svg>
      </button>
    </div>
  );
};

const NewHome = ({
  blockedNote,
  failNote,
  onCreate,
  pending,
  recents,
}: {
  blockedNote: string | null;
  failNote: string | null;
  onCreate: (name: string) => void;
  pending: boolean;
  recents: Recent[];
}) => {
  const [name, setName] = useState("");
  const blocked = blockedNote !== null;

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-[680px] flex-col px-6 pt-[14vh] pb-16">
        <h1 className="text-center text-[34px] font-semibold tracking-tight sm:text-[38px]">
          何を作りますか？
        </h1>
        <p className="text-ink-2 mt-3 text-center text-[15px]">
          名前を付けると、保存先と実行環境をつくります。
        </p>
        <div className="mt-8">
          <NameComposer
            disabled={blocked}
            name={name}
            onName={setName}
            onSubmit={() => {
              onCreate(name);
            }}
            pending={pending}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {NAME_IDEAS.map((idea) => (
            <button
              className="border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink rounded-full border px-3 py-1.5 text-[13px] transition-colors duration-150"
              key={idea}
              onClick={() => {
                setName(idea);
              }}
              type="button"
            >
              {idea}
            </button>
          ))}
        </div>
        {blockedNote ? (
          <p className="shell-note mt-6">
            {blockedNote}
            <Link
              className="text-ink ml-2 underline underline-offset-2"
              href="/connect"
            >
              接続へ
            </Link>
          </p>
        ) : null}
        {failNote ? (
          <p className="text-red mt-4 text-[13px]">{failNote}</p>
        ) : null}

        {recents.length > 0 ? (
          <div className="mt-14">
            <p className="text-ink-3 mb-2 text-[12px] font-medium">
              最近のアプリ
            </p>
            <ul className="divide-line divide-y">
              {recents.map((item) => (
                <li key={item.href}>
                  <Link
                    className="group hover:bg-hover -mx-3 flex items-center gap-3 rounded-[10px] px-3 py-2.5 transition-colors duration-150"
                    href={item.href}
                  >
                    <span className="bg-accent-tint text-accent-ink flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[12px] font-semibold">
                      {item.name.slice(0, 1)}
                    </span>
                    <span className="text-ink min-w-0 flex-1 truncate text-[14px] font-medium">
                      {item.name}
                    </span>
                    <span className="text-ink-3 text-[12px]">{item.note}</span>
                    <svg
                      aria-hidden="true"
                      className="text-ink-3 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
                      fill="none"
                      height="14"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="14"
                    >
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </main>
  );
};

const NewLive = () => {
  const router = useRouter();
  const port = useConnectionsPort();
  const apps = useWorkspaceList();
  const createApp = useCreateNamedApp();
  const [pending, setPending] = useState(false);
  const [failNote, setFailNote] = useState<string | null>(null);

  let blockedNote: string | null = "接続を確認しています。";
  if (port.board) {
    blockedNote = port.board.allConnected
      ? null
      : "接続がそろうまで、作成は始めません。";
  }

  const recents: Recent[] = (apps ?? []).slice(0, 5).map((app) => ({
    href: `/p/${app.slug}`,
    name: app.name,
    note: relativeFrom(app.updatedAt, Date.now()),
  }));

  const onCreate = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length === 0 || pending) {
      return;
    }
    setPending(true);
    setFailNote(null);
    void (async () => {
      try {
        const created = await createApp({ name: trimmed });
        router.push(`/p/${created.slug}/creating`);
      } catch (error) {
        setFailNote(connectErrorMessage(error));
        setPending(false);
      }
    })();
  };

  return (
    <NewHome
      blockedNote={blockedNote}
      failNote={failNote}
      onCreate={onCreate}
      pending={pending}
      recents={recents}
    />
  );
};

const NewOffline = () => {
  const router = useRouter();
  const shell = useShell();

  const recents: Recent[] = shell.state.apps.slice(0, 5).map((app) => ({
    href: app.status === "creating" ? `/p/${app.id}/creating` : `/p/${app.id}`,
    name: app.name,
    note: relativeFrom(app.createdAt, Date.now()),
  }));

  return (
    <NewHome
      blockedNote={null}
      failNote={null}
      onCreate={(name) => {
        const trimmed = name.trim();
        if (trimmed.length === 0) {
          return;
        }
        const id = shell.createApp(trimmed);
        router.push(`/p/${id}/creating`);
      }}
      pending={false}
      recents={recents}
    />
  );
};

export const NewScreen = () => {
  const live = hasConvexUrl();
  return (
    <ShellGate>
      <AppFrame>{live ? <NewLive /> : <NewOffline />}</AppFrame>
    </ShellGate>
  );
};
