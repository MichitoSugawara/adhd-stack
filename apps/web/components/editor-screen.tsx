"use client";

import { Button } from "@cloudflare/kumo";
import {
  ArrowLeftIcon,
  ChatCircleDotsIcon,
  CodeIcon,
  PaperPlaneTiltIcon,
  StackIcon,
  TerminalWindowIcon,
} from "@phosphor-icons/react";
import { useAction, useMutation, useQuery } from "convex/react";
import {
  App as KonstaApp,
  Button as KonstaButton,
  Card as KonstaCard,
  Glass as KonstaGlass,
  Page as KonstaPage,
} from "konsta/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { EditorLocked } from "./editor-locked";

export const EditorScreen = () => {
  const board = useQuery(api.connections.getBoard);
  const workspace = useQuery(api.workspaces.getMine);
  const ensure = useMutation(api.workspaces.ensure);
  const provision = useAction(api.workspaceProvision.provision);
  const publish = useMutation(api.workspaces.publish);
  const send = useMutation(api.chat.send);
  const messages = useQuery(
    api.chat.list,
    workspace
      ? {
          paginationOpts: { cursor: null, numItems: 50 },
          workspaceId: workspace._id,
        }
      : "skip"
  );
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [publishResult, setPublishResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!board?.allConnected) {
      return;
    }
    if (workspace === undefined) {
      return;
    }
    if (workspace?.provisionStatus === "ready") {
      return;
    }
    void (async () => {
      await ensure({});
      await provision({});
    })();
  }, [board?.allConnected, ensure, provision, workspace]);

  const onSend = async () => {
    if (!workspace || draft.trim().length === 0) {
      return;
    }
    setBusy(true);
    try {
      await send({ text: draft, workspaceId: workspace._id });
      setDraft("");
    } finally {
      setBusy(false);
    }
  };

  const onPublish = async () => {
    const result = await publish({});
    const parts = [
      result.cloudflarePagesUrl
        ? `Pages: ${result.cloudflarePagesUrl}`
        : "Pages URL はまだありません",
      result.convexUrl
        ? `Convex: ${result.convexUrl}`
        : "Convex URL はまだありません",
    ];
    setPublishResult(parts.join(" / "));
  };

  const thread: Doc<"messages">[] = messages?.page ?? [];

  if (!board?.allConnected) {
    return <EditorLocked waiting={board === undefined} />;
  }

  return (
    <>
      <main className="desktop-experience editor-shell">
        <aside className="editor-sidebar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <StackIcon size={19} weight="bold" />
            </span>
            <span>ADHD Stack</span>
          </div>
          <nav aria-label="エディターツール">
            <button className="sidebar-item is-active" type="button">
              <ChatCircleDotsIcon size={18} />
              チャット
            </button>
            <button className="sidebar-item" type="button">
              <CodeIcon size={18} />
              ファイル
            </button>
            <button className="sidebar-item" type="button">
              <TerminalWindowIcon size={18} />
              コマンド
            </button>
          </nav>
          <Button
            className="back-button"
            icon={ArrowLeftIcon}
            onClick={() => router.push("/")}
            size="sm"
            variant="ghost"
          >
            接続へ戻る
          </Button>
        </aside>
        <section className="chat-panel">
          <header className="chat-header">
            <div>
              <p className="editor-label">
                {workspace?.githubRepoFullName ?? "WORKSPACE"}
              </p>
              <strong>{workspace?.name ?? "app"}</strong>
            </div>
            <Button
              onClick={() => {
                void onPublish();
              }}
              size="sm"
              variant="primary"
            >
              公開する
            </Button>
          </header>
          {publishResult ? (
            <p className="publish-result" role="status">
              {publishResult}
            </p>
          ) : null}
          {workspace?.provisionError ? (
            <p className="oauth-error" role="status">
              {workspace.provisionError}
            </p>
          ) : null}
          <div className="chat-thread">
            {thread.length === 0 ? (
              <div className="chat-empty">
                <span className="empty-icon" aria-hidden="true">
                  <ChatCircleDotsIcon size={28} weight="duotone" />
                </span>
                <h1>何を作りますか？</h1>
                <p>話しかけるだけで、コードが書き始められます。</p>
              </div>
            ) : (
              thread.map((message) => (
                <article
                  className={`chat-message chat-message--${message.role} chat-message--${message.kind}`}
                  key={message._id}
                >
                  <p className="editor-label">{message.kind}</p>
                  <p>{message.body}</p>
                </article>
              ))
            )}
          </div>
          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              void onSend();
            }}
          >
            <label className="sr-only" htmlFor="prompt">
              作りたいものを入力
            </label>
            <textarea
              id="prompt"
              name="prompt"
              onChange={(event) => setDraft(event.target.value)}
              placeholder="作りたいものを話してください…"
              rows={3}
              value={draft}
            />
            <Button
              aria-label="送信"
              disabled={busy || draft.trim().length === 0}
              icon={PaperPlaneTiltIcon}
              shape="circle"
              title="送信"
              type="submit"
              variant="primary"
            />
          </form>
        </section>
      </main>
      <KonstaApp
        className="mobile-experience"
        dark={false}
        safeAreas
        theme="ios"
      >
        <KonstaPage className="mobile-page mobile-editor-page">
          <header className="mobile-editor-nav">
            <KonstaButton
              aria-label="接続へ戻る"
              className="mobile-circle-button"
              clear
              onClick={() => router.push("/")}
              rounded
            >
              <ArrowLeftIcon size={25} weight="bold" />
            </KonstaButton>
            <strong>{workspace?.name ?? "app"}</strong>
            <KonstaButton
              className="mobile-circle-button"
              onClick={() => {
                void onPublish();
              }}
              rounded
            >
              公開
            </KonstaButton>
          </header>
          <div className="mobile-conversation">
            {thread.map((message) => (
              <div
                className={
                  message.role === "user"
                    ? "mobile-user-message"
                    : "mobile-assistant-copy"
                }
                key={message._id}
              >
                {message.kind === "text" ? null : (
                  <p className="mobile-tool-summary">{message.kind}</p>
                )}
                {message.body}
              </div>
            ))}
          </div>
          <div className="mobile-composer-dock">
            <KonstaGlass className="mobile-composer-glass">
              <textarea
                aria-label="作りたいものを入力"
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Follow up…"
                rows={1}
                value={draft}
              />
              <KonstaButton
                aria-label="送信"
                className="mobile-stop-button"
                disabled={busy || draft.trim().length === 0}
                onClick={() => {
                  void onSend();
                }}
                rounded
              >
                <PaperPlaneTiltIcon size={16} weight="fill" />
              </KonstaButton>
            </KonstaGlass>
          </div>
        </KonstaPage>
        {publishResult ? (
          <KonstaCard className="mobile-changes-card">
            {publishResult}
          </KonstaCard>
        ) : null}
      </KonstaApp>
    </>
  );
};
