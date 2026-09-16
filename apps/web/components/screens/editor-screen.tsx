"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import PromptBar from "@/components/primitives/PromptBar";
import StreamingText from "@/components/primitives/StreamingText";
import TaskRows from "@/components/primitives/TaskRows";
import { EditorEnvRail } from "@/components/screens/editor-env-rail";
import { EditorPreviewPane } from "@/components/screens/editor-preview-pane";
import type { EditorSideTab } from "@/components/screens/editor-preview-pane";
import { DisabledAction } from "@/components/screens/env-card";
import { NewPreviewModal } from "@/components/screens/env-modals";
import { UrlChip } from "@/components/screens/url-chip";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import {
  laterSettlesTools,
  taskRowsFromThinking,
  taskRowsFromTools,
} from "@/lib/chat-tasks";
import type { ChangeSummary } from "@/lib/chat-view";
import { changeSummaryFromView, toChatView } from "@/lib/chat-view";
import {
  useChatMessages,
  useSendChat,
  useWorkspaceBySlug,
} from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";
import { hasConvexUrl } from "@/lib/env";
import { writeLastWorkspace } from "@/lib/last-workspace";
import { previewUrlsFrom, publicHttpUrl } from "@/lib/public-url";
import { usePublishFlow, useSyncPagesEnvironments } from "@/lib/publish-flow";
import { useShell } from "@/lib/shell-state";

const STARTERS = [
  "通知をやさしくする",
  "時間の区切りを足す",
  "色を落ち着かせる",
];

const TASK_LABELS = {
  completed: "完了",
  failed: "失敗",
  running: "処理中",
  waiting: "待機",
} as const;

const emptyChanges = (): ChangeSummary => ({ add: 0, del: 0, files: [] });

const SIDE_TABS: { id: EditorSideTab; label: string }[] = [
  { id: "preview", label: "ブラウザ" },
  { id: "source", label: "ソース" },
  { id: "changes", label: "変更" },
  { id: "history", label: "履歴" },
];

const EditorHeader = ({
  envsHref,
  name,
  onTab,
  pagesUrl,
  previewHref,
  tab,
  waiting,
}: {
  envsHref: string;
  name: string;
  onTab: (tab: EditorSideTab) => void;
  pagesUrl: string | null;
  previewHref: string | null;
  tab: EditorSideTab;
  waiting: boolean;
}) => (
  <header className="border-line flex flex-col gap-2 border-b px-5 py-2.5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-[15px] font-semibold">{name}</h1>
      <div className="flex flex-wrap items-center gap-1">
        {SIDE_TABS.map((item) => (
          <button
            className={`rounded-control h-8 px-2.5 text-[12px] font-medium ${
              tab === item.id ? "bg-field text-ink" : "text-ink-3"
            }`}
            key={item.id}
            onClick={() => {
              onTab(item.id);
            }}
            type="button"
          >
            {item.label}
          </button>
        ))}
        {previewHref ? (
          <a
            className="rounded-control bg-field text-ink inline-flex h-8 items-center px-3 text-[13px] font-medium"
            href={previewHref}
            rel="noreferrer"
            target="_blank"
          >
            開く
          </a>
        ) : null}
        <Link
          className="btn-accent rounded-control inline-flex h-8 items-center px-3 text-[13px] font-medium"
          href={envsHref}
        >
          環境
        </Link>
        <DisabledAction>検証へ送る</DisabledAction>
      </div>
    </div>
    {pagesUrl ? <UrlChip href={pagesUrl} waiting={waiting} /> : null}
    {waiting ? (
      <p className="text-ink-3 text-[13px]">
        本番の組み立てを待っています。完了はまだ見ていません。
        <Link
          className="text-ink ml-2 underline underline-offset-2"
          href={envsHref}
        >
          環境を見る
        </Link>
      </p>
    ) : null}
  </header>
);

const EditorComposer = ({
  disabled,
  onSend,
  placeholder,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
  placeholder: string;
}) => (
  <div className="border-line border-t px-5 py-3">
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex flex-wrap gap-2">
        {STARTERS.map((starter) => (
          <button
            className="rounded-chip bg-field text-ink-2 hover:bg-hover disabled:text-ink-3 h-7 px-2.5 text-[12px]"
            disabled={disabled}
            key={starter}
            onClick={() => {
              onSend(starter);
            }}
            type="button"
          >
            {starter}
          </button>
        ))}
      </div>
      <PromptBar
        demo={false}
        disabled={disabled}
        onSend={onSend}
        placeholder={placeholder}
        sendLabel="送信"
      />
    </div>
  </div>
);

const EditorLive = ({ slug }: { slug: string }) => {
  const workspace = useWorkspaceBySlug(slug);
  const messages = useChatMessages(workspace?._id);
  const sendChat = useSendChat();
  const publishFlow = usePublishFlow(slug, workspace);
  useSyncPagesEnvironments(slug, workspace?.ready === true);
  const [failNote, setFailNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pane, setPane] = useState<EditorSideTab>("preview");

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

  const { ready } = workspace;
  const view = toChatView(messages ?? []);
  const changes = changeSummaryFromView(view);
  const pagesUrl = publicHttpUrl(workspace.cloudflarePagesUrl);
  const previewUrls = previewUrlsFrom(
    workspace.cloudflarePreviewUrl,
    workspace.cloudflarePreviewUrls
  );
  const previewUrl = previewUrls[0] ?? null;
  const envsHref = `/p/${slug}/envs`;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0 || sending) {
      return;
    }
    if (!ready) {
      setFailNote("保存先と実行環境の準備が終わるまで送れません");
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
        envsHref={envsHref}
        name={workspace.name}
        onTab={setPane}
        pagesUrl={pagesUrl}
        previewHref={previewUrl}
        tab={pane}
        waiting={publishFlow.waiting}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <EditorEnvRail
          changes={changes}
          envsHref={envsHref}
          name={workspace.name}
          onNewPreview={() => {
            setPreviewOpen(true);
          }}
          pagesUrl={pagesUrl}
          previewUrls={previewUrls}
          waiting={publishFlow.waiting}
        />
        <div className="flex min-h-0 flex-1 flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
              <div className="mx-auto flex max-w-2xl flex-col gap-5">
                {ready ? (
                  <p className="shell-note">
                    指示は実行環境に送られます。反映は環境から。
                  </p>
                ) : (
                  <p className="shell-note">
                    実行環境の準備が終わるまで送れません。
                    {workspace.provisionError
                      ? ` ${workspace.provisionError}`
                      : " 作成中の画面で進捗を確認してください。"}
                  </p>
                )}
                {failNote ? (
                  <p className="text-red text-[13px]">{failNote}</p>
                ) : null}
                {view.length === 0 ? (
                  <p className="text-ink-2 text-[14px]">
                    最初の指示を書いてください。
                  </p>
                ) : null}
                {view.map((item, index) => {
                  if (item.type === "user") {
                    return (
                      <div
                        className="rounded-card bg-accent-tint ml-auto max-w-[80%] px-3.5 py-2.5 text-[14px]"
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
                        labels={TASK_LABELS}
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
                        labels={TASK_LABELS}
                        rows={taskRowsFromTools(
                          item,
                          laterSettlesTools(view, index)
                        )}
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
            <EditorComposer
              disabled={!ready || sending}
              onSend={(text) => {
                void send(text);
              }}
              placeholder={
                ready ? "何を作りたいですか？" : "準備が終わるまで送れません"
              }
            />
          </div>
          <EditorPreviewPane
            changes={changes}
            pagesUrl={pagesUrl}
            previewUrl={previewUrl}
            tab={pane}
            waiting={publishFlow.waiting}
          />
        </div>
      </div>
      {previewOpen ? (
        <NewPreviewModal
          existingPreviewUrl={previewUrl}
          onClose={() => {
            setPreviewOpen(false);
          }}
          productionUrl={pagesUrl}
        />
      ) : null}
    </div>
  );
};

const EditorSkeleton = ({ appId }: { appId: string }) => {
  const shell = useShell();
  const app = shell.state.apps.find((item) => item.id === appId);
  const envsHref = `/p/${appId}/envs`;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EditorHeader
        envsHref={envsHref}
        name={app?.name ?? appId}
        onTab={() => {
          // Offline header has no side pane.
        }}
        pagesUrl={null}
        previewHref={null}
        tab="preview"
        waiting={false}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <EditorEnvRail
          changes={emptyChanges()}
          envsHref={envsHref}
          name={app?.name ?? appId}
          onNewPreview={() => {
            // Offline rail has no preview creation.
          }}
          pagesUrl={null}
          previewUrls={[]}
          waiting={false}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
            <div className="mx-auto flex max-w-2xl flex-col gap-5">
              <p className="shell-note">
                Convex 未設定のため会話は送れません。
              </p>
            </div>
          </div>
          <EditorComposer
            disabled
            onSend={() => {
              // Offline composer cannot send.
            }}
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
