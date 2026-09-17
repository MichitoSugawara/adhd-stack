"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import PromptBar from "@/components/primitives/PromptBar";
import StreamingText from "@/components/primitives/StreamingText";
import TaskRows from "@/components/primitives/TaskRows";
import { DeleteAppButton } from "@/components/screens/delete-app-dialog";
import { EditorEnvRail } from "@/components/screens/editor-env-rail";
import { EditorPreviewPane } from "@/components/screens/editor-preview-pane";
import type { EditorSideTab } from "@/components/screens/editor-preview-pane";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { WorkspaceIcon } from "@/components/shell/workspace-icon";
import {
  clearAppIdeaDraft,
  readAppIdeaDraft,
  saveAppIdeaDraft,
} from "@/lib/app-draft";
import {
  laterSettlesTools,
  taskRowsFromThinking,
  taskRowsFromTools,
} from "@/lib/chat-tasks";
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

import "./studio.css";

const TASK_LABELS = {
  completed: "完了",
  failed: "失敗",
  running: "処理中",
  waiting: "待機",
} as const;
const STARTERS = [
  "今日やることを整理するアプリ",
  "小さな習慣を記録するアプリ",
  "思いつきをすぐに残せるメモ",
];
const EMPTY_PREVIEWS: readonly string[] = [];

const editorLabels = (ready: boolean, offline: boolean) => {
  if (offline) {
    return {
      placeholder: "接続すると、指示を送れます",
      state: "UI プレビュー",
    };
  }
  if (ready) {
    return { placeholder: "何をつくりますか？", state: "アプリの編集" };
  }
  return {
    placeholder: "準備が完了するまでお待ちください",
    state: "環境の準備中",
  };
};

const ReadinessNotice = ({
  offline,
  provisionError,
  slug,
}: {
  offline: boolean;
  provisionError?: string;
  slug: string;
}) => (
  <div className="studio-notice">
    <span className="studio-dot is-waiting" />
    <div>
      <strong>
        {offline ? "画面のプレビューです" : "環境を準備しています"}
      </strong>
      <p>
        {offline
          ? "実行環境が未接続のため、指示は送信されません。"
          : (provisionError ?? "準備が完了すると、ここから指示を送れます。")}
      </p>
      <Link href={offline ? "/connect" : `/p/${slug}/creating`}>
        {offline ? "接続を確認" : "準備の状況を見る"}{" "}
        <WorkspaceIcon name="arrow" size={13} />
      </Link>
    </div>
  </div>
);

const EditorWorkspace = ({
  slug,
  name,
  ready,
  offline = false,
  messages,
  previewUrls = EMPTY_PREVIEWS,
  pagesUrl = null,
  waiting = false,
  provisionError,
  sending = false,
  failNote,
  onSend,
}: {
  slug: string;
  name: string;
  ready: boolean;
  offline?: boolean;
  messages: ReturnType<typeof toChatView>;
  previewUrls?: readonly string[];
  pagesUrl?: string | null;
  waiting?: boolean;
  provisionError?: string;
  sending?: boolean;
  failNote?: string | null;
  onSend: (text: string) => Promise<boolean>;
}) => {
  const [pane, setPane] = useState<EditorSideTab>("preview");
  const [mobilePane, setMobilePane] = useState<"chat" | "preview">("chat");
  const [draft, setDraft] = useState<string | null>(null);
  const [draftVersion, setDraftVersion] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const changes = changeSummaryFromView(messages);
  const labels = editorLabels(ready, offline);

  useEffect(() => {
    setDraft(readAppIdeaDraft(slug));
  }, [slug]);
  useEffect(() => {
    if (stickToBottom.current && scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [messages]);

  const setStarter = (text: string) => {
    setDraft(text);
    saveAppIdeaDraft(slug, text);
    setDraftVersion((value) => value + 1);
  };

  return (
    <main className="studio" data-mobile-pane={mobilePane}>
      <header className="studio-project-header">
        <div className="studio-project-identity">
          <span className="studio-project-mark" aria-hidden="true">
            <WorkspaceIcon name="apps" size={18} />
          </span>
          <div>
            <h1>{name}</h1>
            <span>{labels.state}</span>
          </div>
        </div>
        <div className="studio-project-actions">
          {offline ? null : <DeleteAppButton name={name} slug={slug} />}
          <Link className="ui-button" href={`/p/${slug}/envs`}>
            環境
          </Link>
          <Link className="ui-button-primary" href={`/p/${slug}/publish`}>
            公開する{" "}
            <WorkspaceIcon
              name="arrow"
              size={14}
              style={{ transform: "rotate(-45deg)" }}
            />
          </Link>
        </div>
      </header>
      <div className="studio-mobile-tabs" aria-label="作業画面の切り替え">
        <button
          aria-pressed={mobilePane === "chat"}
          onClick={() => setMobilePane("chat")}
          type="button"
        >
          チャット
        </button>
        <button
          aria-pressed={mobilePane === "preview"}
          onClick={() => setMobilePane("preview")}
          type="button"
        >
          プレビュー
        </button>
      </div>
      <div className="studio-split">
        <section className="studio-chat" aria-label="アプリをつくるチャット">
          <div className="studio-pane-heading">
            <h2>
              <WorkspaceIcon name="spark" size={16} /> いっしょにつくる
            </h2>
            <span className="studio-pane-meta">
              {sending ? "WORKING" : "CHAT"}
            </span>
          </div>
          <div
            className="studio-chat-scroll"
            onScroll={() => {
              const node = scrollRef.current;
              if (node) {
                stickToBottom.current =
                  node.scrollHeight - node.scrollTop - node.clientHeight < 80;
              }
            }}
            ref={scrollRef}
          >
            {!ready && (
              <ReadinessNotice
                offline={offline}
                provisionError={provisionError}
                slug={slug}
              />
            )}
            {messages.length === 0 ? (
              <div className="studio-chat-welcome">
                <span className="studio-assistant-mark" aria-hidden="true">
                  <WorkspaceIcon name="spark" size={22} />
                </span>
                <h2>まずは、小さなアイデアから。</h2>
                <p>
                  完成形が決まっていなくても大丈夫。
                  <br />
                  ほしいものを、ふだんの言葉で教えてください。
                </p>
                <div className="studio-starters">
                  {STARTERS.map((starter) => (
                    <button
                      disabled={sending}
                      key={starter}
                      onClick={() => setStarter(starter)}
                      type="button"
                    >
                      <span>{starter}</span>
                      <WorkspaceIcon
                        name="arrow"
                        size={13}
                        style={{ transform: "rotate(-45deg)" }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="studio-messages">
              {messages.map((item, index) => {
                if (item.type === "user") {
                  return (
                    <div className="studio-user-message" key={item.id}>
                      {item.body}
                    </div>
                  );
                }
                if (item.type === "system") {
                  return (
                    <p className="studio-system-message" key={item.id}>
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
                        laterSettlesTools(messages, index)
                      )}
                      variant="List"
                    />
                  );
                }
                return (
                  <div className="studio-assistant-message" key={item.id}>
                    <StreamingText
                      content={[{ text: item.body }]}
                      followUps={[]}
                      labels={{ followUps: "", sources: "" }}
                      loop={false}
                      sources={[]}
                    />
                  </div>
                );
              })}
            </div>
            {sending ? (
              <p className="studio-working" role="status">
                <span className="studio-dot is-waiting" />
                指示を送信しています…
              </p>
            ) : null}
            {failNote ? (
              <p className="studio-error" role="alert">
                {failNote}
              </p>
            ) : null}
          </div>
          <div className="studio-composer">
            {draft !== null && (
              <PromptBar
                demo={false}
                disabled={!ready || sending}
                initialValue={draft}
                key={`${slug}-${draftVersion}`}
                onDraftChange={(text) => saveAppIdeaDraft(slug, text)}
                onSend={onSend}
                placeholder={labels.placeholder}
                sendLabel="指示を送信"
              />
            )}
            <div className="studio-composer-hint">
              <span>
                {ready ? "ひとつずつ、かたちに。" : "まだ指示は送信されません"}
              </span>
              <span>
                <kbd>Enter</kbd> 送信 · <kbd>Shift Enter</kbd> 改行
              </span>
            </div>
          </div>
        </section>
        <EditorPreviewPane
          changes={changes}
          onTab={setPane}
          pagesUrl={pagesUrl}
          previewUrl={previewUrls[0]}
          tab={pane}
          waiting={waiting}
        />
      </div>
      <EditorEnvRail
        changes={changes}
        envsHref={`/p/${slug}/envs`}
        pagesUrl={pagesUrl}
        previewUrls={previewUrls}
        waiting={waiting}
      />
    </main>
  );
};

const EditorLive = ({ slug }: { slug: string }) => {
  const workspace = useWorkspaceBySlug(slug);
  const messages = useChatMessages(workspace?._id);
  const sendChat = useSendChat();
  const publishFlow = usePublishFlow(slug, workspace);
  useSyncPagesEnvironments(slug, workspace?.ready === true);
  const [failNote, setFailNote] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (workspace) {
      writeLastWorkspace({ name: workspace.name, path: `/p/${slug}`, slug });
    }
  }, [slug, workspace]);
  if (workspace === undefined) {
    return (
      <main className="studio-page">
        <p className="studio-muted">読み込んでいます…</p>
      </main>
    );
  }
  if (workspace === null) {
    return (
      <main className="studio-page">
        <h1>アプリが見つかりません</h1>
        <Link className="ui-button" href="/projects">
          アプリ一覧に戻る
        </Link>
      </main>
    );
  }

  const send = async (text: string): Promise<boolean> => {
    if (!text.trim() || sending || !workspace.ready) {
      return false;
    }
    setSending(true);
    setFailNote(null);
    try {
      await sendChat({ text: text.trim(), workspaceId: workspace._id });
      if (readAppIdeaDraft(slug).trim() === text.trim()) {
        clearAppIdeaDraft(slug);
      }
      return true;
    } catch (error) {
      setFailNote(connectErrorMessage(error));
      return false;
    } finally {
      setSending(false);
    }
  };
  return (
    <EditorWorkspace
      failNote={failNote}
      messages={toChatView(messages ?? [])}
      name={workspace.name}
      onSend={send}
      pagesUrl={publicHttpUrl(workspace.cloudflarePagesUrl)}
      previewUrls={previewUrlsFrom(
        workspace.cloudflarePreviewUrl,
        workspace.cloudflarePreviewUrls
      )}
      provisionError={workspace.provisionError}
      ready={workspace.ready}
      sending={sending}
      slug={slug}
      waiting={publishFlow.waiting}
    />
  );
};

const EditorSkeleton = ({ appId }: { appId: string }) => {
  const shell = useShell();
  const app = shell.state.apps.find((item) => item.id === appId);
  return (
    <EditorWorkspace
      messages={[]}
      name={app?.name ?? appId}
      offline
      onSend={() => Promise.resolve(false)}
      ready={false}
      slug={appId}
    />
  );
};

export const EditorScreen = ({ appId }: { appId: string }) => (
  <ShellGate>
    <AppFrame>
      {hasConvexUrl() ? (
        <EditorLive slug={appId} />
      ) : (
        <EditorSkeleton appId={appId} />
      )}
    </AppFrame>
  </ShellGate>
);
