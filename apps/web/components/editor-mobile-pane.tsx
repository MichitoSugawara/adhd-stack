"use client";

import { ArrowLeftIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import {
  App as KonstaApp,
  Button as KonstaButton,
  Glass as KonstaGlass,
  Page as KonstaPage,
} from "konsta/react";
import { useRouter } from "next/navigation";

import { KIND_LABELS } from "../lib/editor-copy";
import { PROMPT_CHIPS } from "../lib/mock-copy";
import type { useEditorWorkspace } from "../lib/use-editor-workspace";
import { DemoBanner } from "./demo-banner";
import { DiffHunkList } from "./diff-hunk";
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
    <KonstaApp className="mobile-experience" dark safeAreas theme="ios">
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
            className="mobile-publish-button"
            disabled={publishing || !ready}
            onClick={() => {
              void publish();
            }}
            rounded
          >
            公開
          </KonstaButton>
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
        <div className="mobile-conversation">
          {visibleThread.length === 0 ? (
            <div className="chat-empty">
              <h1>何を作りますか</h1>
              <p>デモの思考と差分が流れます。</p>
            </div>
          ) : (
            visibleThread.map((message) => (
              <div
                className={
                  message.role === "user"
                    ? "mobile-user-message"
                    : "mobile-assistant-copy"
                }
                key={message._id}
              >
                {message.kind === "text" ? null : (
                  <p className="mobile-tool-summary">
                    {KIND_LABELS[message.kind]}
                  </p>
                )}
                {message.kind === "diff" && message.meta?.hunks ? (
                  <DiffHunkList
                    additions={message.meta.additions}
                    deletions={message.meta.deletions}
                    hunks={message.meta.hunks}
                  />
                ) : (
                  message.body
                )}
              </div>
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
          <KonstaGlass className="mobile-composer-glass">
            <textarea
              aria-label="作りたいものを入力"
              disabled={!ready}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={ready ? "作りたいものを話す（デモ）" : "準備中"}
              rows={1}
              value={draft}
            />
            <KonstaButton
              aria-label="送信"
              className="mobile-stop-button"
              disabled={composerDisabled}
              onClick={() => {
                void send();
              }}
              rounded
            >
              <PaperPlaneTiltIcon size={16} weight="fill" />
            </KonstaButton>
          </KonstaGlass>
        </div>
      </KonstaPage>
    </KonstaApp>
  );
};
