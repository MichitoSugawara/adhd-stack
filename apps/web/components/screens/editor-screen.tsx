"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import PromptBar from "@/components/primitives/PromptBar";
import StreamingText from "@/components/primitives/StreamingText";
import TaskRows from "@/components/primitives/TaskRows";
import { UrlChip } from "@/components/screens/url-chip";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import {
  laterSettlesTools,
  taskRowsFromThinking,
  taskRowsFromTools,
} from "@/lib/chat-tasks";
import { toChatView } from "@/lib/chat-view";
import {
  useChatMessages,
  useSendChat,
  useWorkspaceBySlug,
} from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";
import { hasConvexUrl } from "@/lib/env";
import { writeLastWorkspace } from "@/lib/last-workspace";
import { publicHttpUrl } from "@/lib/public-url";
import { usePublishFlow } from "@/lib/publish-flow";
import { useShell } from "@/lib/shell-state";

const STARTERS = [
  "通知をやさしくする",
  "時間の区切りを足す",
  "色を落ち着かせる",
];

const EditorHeader = ({
  name,
  pagesUrl,
  previewHref,
  publishHref,
  waiting,
}: {
  name: string;
  pagesUrl: string | null;
  previewHref: string | null;
  publishHref: string;
  waiting: boolean;
}) => (
  <header className="border-line flex flex-col gap-3 border-b px-5 py-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-ink-3 text-[12px]">チャット</p>
        <h1 className="text-[16px] font-semibold">{name}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {previewHref ? (
          <a
            className="rounded-control bg-field text-ink inline-flex h-8 items-center px-3 text-[13px] font-medium"
            href={previewHref}
            rel="noreferrer"
            target="_blank"
          >
            プレビュー
          </a>
        ) : (
          <span className="rounded-control bg-field text-ink-3 inline-flex h-8 items-center px-3 text-[13px]">
            プレビュー
          </span>
        )}
        <Link
          className="btn-accent rounded-control inline-flex h-8 items-center px-3 text-[13px] font-medium"
          href={publishHref}
        >
          公開
        </Link>
      </div>
    </div>
    {pagesUrl ? <UrlChip href={pagesUrl} waiting={waiting} /> : null}
    {waiting ? (
      <p className="text-ink-3 text-[13px]">
        Pages のビルドを待っています。完了はまだ見ていません。
        <Link
          className="text-ink ml-2 underline underline-offset-2"
          href={publishHref}
        >
          公開画面
        </Link>
      </p>
    ) : null}
  </header>
);

const EditorLive = ({ slug }: { slug: string }) => {
  const workspace = useWorkspaceBySlug(slug);
  const messages = useChatMessages(workspace?._id);
  const sendChat = useSendChat();
  const publishFlow = usePublishFlow(slug, workspace);
  const [failNote, setFailNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    writeLastWorkspace({
      name: workspace.name,
      path: `/p/${slug}`,
      slug,
    });
  }, [slug, workspace]);

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
  const pagesUrl = publicHttpUrl(workspace.cloudflarePagesUrl);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || sending) {
      return;
    }
    if (!ready) {
      setFailNote("リポジトリと実行環境の準備が終わるまで送れません");
      return;
    }
    setSending(true);
    setFailNote(null);
    try {
      await sendChat({ text: trimmed, workspaceId: workspace._id });
    } catch (error) {
      setFailNote(connectErrorMessage(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EditorHeader
        name={workspace.name}
        pagesUrl={pagesUrl}
        previewHref={pagesUrl}
        publishHref={`/p/${slug}/publish`}
        waiting={publishFlow.waiting}
      />
      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          {ready ? (
            <p className="shell-note">
              指示は実行環境に送られます。公開は右上です。
            </p>
          ) : (
            <p className="shell-note">
              実行環境の準備が終わるまで送れません。
              {workspace.provisionError
                ? ` ${workspace.provisionError}`
                : " 作成中の画面で進捗を確認してください。"}
            </p>
          )}
          {failNote ? <p className="text-red text-[13px]">{failNote}</p> : null}
          {view.length === 0 ? (
            <p className="text-ink-2 text-[14px]">
              最初の指示を書いてください。
            </p>
          ) : null}
          {view.map((item, index) => {
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
                <TaskRows
                  className="max-w-none"
                  key={item.id}
                  labels={{
                    completed: "完了",
                    failed: "失敗",
                    running: "処理中",
                    waiting: "待機",
                  }}
                  rows={taskRowsFromThinking(item)}
                  variant="List"
                />
              );
            }
            if (item.type === "tools") {
              return (
                <TaskRows
                  className="max-w-none"
                  key={item.id}
                  labels={{
                    completed: "完了",
                    failed: "失敗",
                    running: "処理中",
                    waiting: "待機",
                  }}
                  rows={taskRowsFromTools(item, laterSettlesTools(view, index))}
                  variant="List"
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
          <div className="mb-2 flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <button
                className="rounded-chip bg-field text-ink-2 hover:bg-hover h-7 px-2.5 text-[12px]"
                disabled={!ready || sending}
                key={starter}
                onClick={() => {
                  void send(starter);
                }}
                type="button"
              >
                {starter}
              </button>
            ))}
          </div>
          <PromptBar
            demo={false}
            disabled={!ready || sending}
            onSend={(text) => {
              void send(text);
            }}
            placeholder={
              ready ? "何を作りたいですか？" : "準備が終わるまで送れません"
            }
            sendLabel="送信"
          />
        </div>
      </div>
    </div>
  );
};

const EditorSkeleton = ({ appId }: { appId: string }) => {
  const shell = useShell();
  const app = shell.state.apps.find((item) => item.id === appId);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EditorHeader
        name={app?.name ?? appId}
        pagesUrl={null}
        previewHref={null}
        publishHref={`/p/${appId}/publish`}
        waiting={false}
      />
      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <p className="shell-note">Convex 未設定のため会話は送れません。</p>
        </div>
      </div>
      <div className="border-line border-t px-5 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="mb-2 flex flex-wrap gap-2">
            {STARTERS.map((starter) => (
              <button
                className="rounded-chip bg-field text-ink-3 h-7 px-2.5 text-[12px]"
                disabled
                key={starter}
                type="button"
              >
                {starter}
              </button>
            ))}
          </div>
          <PromptBar
            demo={false}
            disabled
            placeholder="Convex 未設定のため送れません"
            sendLabel="送信"
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
