"use client";

import Link from "next/link";
import { useState } from "react";

import PromptBar from "@/components/primitives/PromptBar";
import StreamingText from "@/components/primitives/StreamingText";
import ThinkingState from "@/components/primitives/ThinkingState";
import ToolChips from "@/components/primitives/ToolChips";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { toChatView } from "@/lib/chat-view";
import { useChatMessages, useSendChat, useWorkspaceBySlug } from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";
import { hasConvexUrl } from "@/lib/env";
import { useShell } from "@/lib/shell-state";

const EditorLive = ({ slug }: { slug: string }) => {
  const workspace = useWorkspaceBySlug(slug);
  const messages = useChatMessages(workspace?._id);
  const sendChat = useSendChat();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

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

  const ready = Boolean(
    workspace.githubRepoUrl && workspace.codingEnvironmentId
  );
  const view = toChatView(messages ?? []);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || sending) {
      return;
    }
    if (!ready) {
      setError("リポジトリと実行環境の準備が終わるまで送れません");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await sendChat({ text: trimmed, workspaceId: workspace._id });
    } catch (caught) {
      setError(connectErrorMessage(caught));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <p className="text-ink-3 text-[12px]">チャット</p>
          <h1 className="text-[16px] font-semibold">{workspace.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="rounded-control text-ink-2 hover:bg-hover flex h-8 items-center px-3 text-[13px]"
            href={`/p/${slug}/envs`}
          >
            環境
          </Link>
          <button
            className="rounded-control bg-field text-ink-3 h-8 px-3 text-[13px] font-medium"
            disabled
            title="Phase 4 でユーザーの Pages と Convex に出します"
            type="button"
          >
            公開（Phase 4）
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {!ready ? (
            <p className="shell-note">
              実行環境の準備が終わるまで送れません。
              {workspace.provisionError
                ? ` ${workspace.provisionError}`
                : " 作成中の画面で進捗を確認してください。"}
            </p>
          ) : (
            <p className="shell-note">
              指示は実行環境に送られます。公開 URL はまだ返しません。
            </p>
          )}
          {error ? <p className="text-red text-[13px]">{error}</p> : null}
          {view.length === 0 ? (
            <p className="text-ink-2 text-[14px]">
              最初の指示を書いてください。偽の成功は出しません。
            </p>
          ) : null}
          {view.map((item) => {
            if (item.type === "user") {
              return (
                <div
                  className="rounded-card bg-inset ml-auto max-w-[80%] px-3 py-2 text-[14px]"
                  key={item.id}
                >
                  {item.body}
                </div>
              );
            }
            if (item.type === "system") {
              return (
                <p className="text-ink-3 text-[12px]" key={item.id}>
                  {item.body}
                </p>
              );
            }
            if (item.type === "thinking") {
              return (
                <ThinkingState
                  active={item.active ? "考えています" : "思考"}
                  done="思考"
                  key={item.id}
                  rows={item.body
                    .split("\n")
                    .filter((line) => line.length > 0)
                    .slice(0, 8)
                    .map((line) => ({ primary: line }))}
                  variant="Steps"
                />
              );
            }
            if (item.type === "tools") {
              return (
                <ToolChips
                  diffs={item.diffs}
                  key={item.id}
                  labels={{ header: "ツール", more: "" }}
                  steps={item.steps}
                />
              );
            }
            return (
              <StreamingText
                content={[{ text: item.body }]}
                followUps={[]}
                key={item.id}
                labels={{ followUps: "", sources: "" }}
                loop={false}
                sources={[]}
              />
            );
          })}
        </div>
      </div>
      <div className="border-line border-t px-5 py-3">
        <div className="mx-auto max-w-2xl">
          <PromptBar
            demo={false}
            disabled={!ready || sending}
            onSend={(text) => {
              void send(text);
            }}
            placeholder={
              ready ? "指示を書く" : "準備が終わるまで送れません"
            }
          />
        </div>
      </div>
    </div>
  );
};

const EditorSkeleton = ({ appId }: { appId: string }) => {
  const shell = useShell();
  const app = shell.state.apps.find((item) => item.id === appId);

  return shell.hydrated && !app ? (
    <main className="px-8 py-10">
      <h1 className="text-[24px] font-semibold">アプリが見つかりません</h1>
    </main>
  ) : (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
        <div>
          <p className="text-ink-3 text-[12px]">チャット</p>
          <h1 className="text-[16px] font-semibold">{app?.name ?? appId}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="rounded-control text-ink-2 hover:bg-hover flex h-8 items-center px-3 text-[13px]"
            href={`/p/${appId}/envs`}
          >
            環境
          </Link>
          <button
            className="rounded-control bg-field text-ink-3 h-8 px-3 text-[13px] font-medium"
            disabled
            title="Phase 4 でユーザーの Pages と Convex に出します"
            type="button"
          >
            公開（Phase 4）
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <p className="shell-note">
            Convex 未設定のため会話は送れません。偽の返答は出しません。
          </p>
        </div>
      </div>
      <div className="border-line border-t px-5 py-3">
        <div className="mx-auto max-w-2xl">
          <PromptBar
            demo={false}
            disabled
            placeholder="Convex 未設定のため送れません"
          />
        </div>
      </div>
    </div>
  );
};

export const EditorScreen = ({ appId }: { appId: string }) => {
  const live = hasConvexUrl();
  return (
    <ShellGate>
      <AppFrame>
        {live ? <EditorLive slug={appId} /> : <EditorSkeleton appId={appId} />}
      </AppFrame>
    </ShellGate>
  );
};
