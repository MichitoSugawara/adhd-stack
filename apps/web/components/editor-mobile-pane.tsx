"use client";

import { App as KonstaApp, Page as KonstaPage } from "konsta/react";
import { useRouter } from "next/navigation";

import { connectFontVariables } from "../lib/connect-fonts";
import { PROMPT_CHIPS } from "../lib/mock-copy";
import type { useEditorWorkspace } from "../lib/use-editor-workspace";
import { DemoBanner } from "./demo-banner";
import { EditorMessageCard } from "./editor-message-card";
import { EditorProvisionStrip } from "./editor-provision-strip";
import { StageStrip } from "./stage-strip";

type EditorState = ReturnType<typeof useEditorWorkspace>;

interface EditorMobilePaneProperties {
  state: EditorState;
}

export const EditorMobilePane = ({ state }: EditorMobilePaneProperties) => {
  const router = useRouter();
  const {
    applyChip,
    composerDisabled,
    draft,
    liveStatus,
    publish,
    publishing,
    ready,
    retryProvision,
    send,
    setDraft,
    visibleThread,
    workspace,
  } = state;

  return (
    <KonstaApp
      className={`atelier mobile-experience ${connectFontVariables}`}
      safeAreas
      theme="ios"
    >
      <KonstaPage className="mobile-page mobile-editor-page">
        <header className="ide-mobile-nav">
          <button
            aria-label="接続へ戻る"
            className="atelier-btn atelier-btn--ghost"
            onClick={() => router.push("/")}
            type="button"
          >
            戻る
          </button>
          <strong>{workspace?.name ?? "app"}</strong>
          <button
            className="atelier-btn atelier-btn--solid"
            disabled={publishing || !ready}
            onClick={() => {
              void publish();
            }}
            type="button"
          >
            公開
          </button>
        </header>
        <StageStrip current="WORK" />
        <DemoBanner />
        <div className="provision-strip--mobile">
          <EditorProvisionStrip
            onRetry={() => {
              void retryProvision();
            }}
            workspace={workspace}
          />
        </div>
        {liveStatus ? (
          <p className="publish-result" role="status">
            {liveStatus}
          </p>
        ) : null}
        <div className="timeline-feed timeline-feed--mobile">
          {visibleThread.length === 0 ? (
            <div className="timeline-empty">
              <h1>活動はまだ空です</h1>
              <p>デモの思考と差分が列になります。</p>
            </div>
          ) : (
            visibleThread.map((message) => (
              <EditorMessageCard key={message._id} message={message} />
            ))
          )}
        </div>
        <div className="mobile-composer-dock">
          <div className="prompt-chips prompt-chips--mobile">
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
            <textarea
              aria-label="作りたいものを入力"
              disabled={!ready}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={ready ? "作りたいものを話す（デモ）" : "準備中"}
              rows={1}
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
        </div>
      </KonstaPage>
    </KonstaApp>
  );
};
