"use client";

import { MOCK_DIFF_HUNKS, PROMPT_CHIPS } from "../lib/mock-copy";
import type { useEditorWorkspace } from "../lib/use-editor-workspace";
import { DemoBanner } from "./demo-banner";
import { DiffHunkList } from "./diff-hunk";
import { EditorMessageCard } from "./editor-message-card";
import { EditorProvisionStrip } from "./editor-provision-strip";
import { EditorSidebar } from "./editor-sidebar";
import { StageStrip } from "./stage-strip";

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
  return "差分はまだありません";
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
    <main className="atelier desktop-experience ide-shell">
      <EditorSidebar
        hasCommands={hasCommands}
        hasDiffs={hasDiffs}
        rail={rail}
        setRail={setRail}
      />
      <section className="ide-center">
        <header className="ide-center-head">
          <div>
            <p className="chapter">
              <em>WORK</em> {workspace?.githubRepoFullName ?? "workspace"}
            </p>
            <strong>{workspace?.name ?? "app"}</strong>
          </div>
          <button
            className="atelier-btn atelier-btn--solid"
            disabled={publishing || !ready}
            onClick={() => {
              void publish();
            }}
            type="button"
          >
            公開する（デモ）
          </button>
        </header>
        <StageStrip current={hasDiffs ? "DIFF" : "WORK"} />
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
        <div className="timeline-feed">
          {visibleThread.length === 0 ? (
            <div className="timeline-empty">
              <p className="chapter">
                <em>04</em> ACTIVITY
              </p>
              <h1>活動はまだ空です</h1>
              <p>話しかけると、思考・作業・差分が静かな列になります。</p>
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
          className="ide-composer"
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
            rows={2}
            value={draft}
          />
          <button
            className="atelier-btn atelier-btn--solid"
            disabled={composerDisabled}
            type="submit"
          >
            送る
          </button>
        </form>
      </section>
      <aside className="ide-diff" aria-label="差分と公開">
        <p className="chapter">
          <em>DIFF</em> REVIEW
        </p>
        <strong>差分 / 公開（モック）</strong>
        <p className="review-status">
          {reviewCopy(publishState.status, hasDiffs)}
        </p>
        {hasDiffs ? (
          <DiffHunkList additions={12} deletions={3} hunks={MOCK_DIFF_HUNKS} />
        ) : (
          <p className="review-status">右面は差分専用です。</p>
        )}
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
