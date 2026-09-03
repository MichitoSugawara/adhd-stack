"use client";

import { Button } from "@cloudflare/kumo";
import { ChatCircleDotsIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";

import { PROMPT_CHIPS } from "../lib/mock-copy";
import type { useEditorWorkspace } from "../lib/use-editor-workspace";
import { DemoBanner } from "./demo-banner";
import { EditorMessageCard } from "./editor-message-card";
import { EditorProvisionStrip } from "./editor-provision-strip";
import { EditorSidebar } from "./editor-sidebar";

type EditorState = ReturnType<typeof useEditorWorkspace>;

const reviewCopy = (
  status: EditorState["publishState"]["status"],
  hasDiffs: boolean
): string => {
  if (status === "published") {
    return "公開済み（デモ）";
  }
  if (status === "publishing") {
    return "公開中（デモ）";
  }
  if (hasDiffs) {
    return "差分あり · 未公開";
  }
  return "まだ差分はありません";
};

interface EditorDesktopPaneProperties {
  state: EditorState;
}

export const EditorDesktopPane = ({ state }: EditorDesktopPaneProperties) => {
  const {
    applyChip,
    composerDisabled,
    draft,
    hasCommands,
    hasDiffs,
    liveStatus,
    publish,
    publishState,
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
              {workspace?.githubRepoFullName ?? "WORKSPACE"} · モック
            </p>
            <strong>{workspace?.name ?? "app"}</strong>
          </div>
          <Button
            disabled={publishing || !ready}
            onClick={() => {
              void publish();
            }}
            size="sm"
            variant="primary"
          >
            公開する（デモ）
          </Button>
        </header>
        <DemoBanner />
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
              <p>話しかけると、デモの思考・作業・差分が流れます。</p>
            </div>
          ) : (
            visibleThread.map((message) => (
              <EditorMessageCard key={message._id} message={message} />
            ))
          )}
        </div>
        <div className="prompt-chips" aria-label="サンプル入力">
          {PROMPT_CHIPS.map((chip) => (
            <button
              disabled={!ready}
              key={chip}
              onClick={() => applyChip(chip)}
              type="button"
            >
              {chip}
            </button>
          ))}
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
            placeholder={
              ready ? "作りたいものを話してください（デモ）" : "準備中…"
            }
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
      <aside className="review-pane" aria-label="差分と公開">
        <p className="editor-label">REVIEW</p>
        <strong>差分 / 公開（モック）</strong>
        <p className="review-status">
          {reviewCopy(publishState.status, hasDiffs)}
        </p>
        {workspace?.cloudflarePagesUrl ? (
          <p className="review-url">{workspace.cloudflarePagesUrl}</p>
        ) : null}
        {workspace?.convexUrl ? (
          <p className="review-url">{workspace.convexUrl}</p>
        ) : null}
      </aside>
    </main>
  );
};
