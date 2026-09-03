"use client";

import { Button } from "@cloudflare/kumo";
import { ChatCircleDotsIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";

import type { useEditorWorkspace } from "../lib/use-editor-workspace";
import { EditorMessageCard } from "./editor-message-card";
import { EditorProvisionStrip } from "./editor-provision-strip";
import { EditorSidebar } from "./editor-sidebar";

type EditorState = ReturnType<typeof useEditorWorkspace>;

interface EditorDesktopPaneProperties {
  state: EditorState;
}

export const EditorDesktopPane = ({ state }: EditorDesktopPaneProperties) => {
  const {
    composerDisabled,
    draft,
    hasCommands,
    hasDiffs,
    liveStatus,
    publish,
    publishing,
    rail,
    ready,
    retryProvision,
    send,
    setDraft,
    setRail,
    visibleThread,
    workspace,
  } = state;

  return (
    <main className="desktop-experience editor-shell">
      <EditorSidebar
        hasCommands={hasCommands}
        hasDiffs={hasDiffs}
        rail={rail}
        setRail={setRail}
      />
      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="editor-label">
              {workspace?.githubRepoFullName ?? "WORKSPACE"}
            </p>
            <strong>{workspace?.name ?? "app"}</strong>
          </div>
          <Button
            disabled={publishing || !workspace?.githubRepoUrl}
            onClick={() => {
              void publish();
            }}
            size="sm"
            variant="primary"
          >
            公開する
          </Button>
        </header>
        <EditorProvisionStrip
          onRetry={() => {
            void retryProvision();
          }}
          workspace={workspace}
        />
        {liveStatus ? (
          <p className="publish-result" role="status">
            {liveStatus}
          </p>
        ) : (
          <p className="sr-only" role="status">
            準備状況
          </p>
        )}
        <div className="chat-thread">
          {visibleThread.length === 0 ? (
            <div className="chat-empty">
              <span className="empty-icon" aria-hidden="true">
                <ChatCircleDotsIcon size={28} weight="duotone" />
              </span>
              <h1>何を作りますか</h1>
              <p>
                {ready
                  ? "話しかけると、Codex Cloud がリポジトリを書き換えます。"
                  : "環境の準備が終わると送れます。"}
              </p>
            </div>
          ) : (
            visibleThread.map((message) => (
              <EditorMessageCard key={message._id} message={message} />
            ))
          )}
        </div>
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <label className="sr-only" htmlFor="prompt">
            作りたいものを入力
          </label>
          <textarea
            disabled={!ready}
            id="prompt"
            name="prompt"
            onChange={(event) => setDraft(event.target.value)}
            placeholder={ready ? "作りたいものを話してください" : "準備中…"}
            rows={3}
            value={draft}
          />
          <Button
            aria-label="送信"
            disabled={composerDisabled}
            icon={PaperPlaneTiltIcon}
            shape="circle"
            title="送信"
            type="submit"
            variant="primary"
          />
        </form>
      </section>
    </main>
  );
};
