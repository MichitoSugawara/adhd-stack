"use client";

import type { ReactNode } from "react";

import type { Message, Preview, Project } from "../lib/mock-types";
import { MessageView } from "./message-view";
import { MobileNav } from "./mobile-nav";

export type HandTab = "changes" | "chat" | "history" | "screen";

interface EditorHandProperties {
  composer: ReactNode;
  onApprove: (ok: boolean) => void;
  onChanges: () => void;
  onHand: (tab: HandTab) => void;
  onLimit: (reset: boolean) => void;
  onPick: (option: string) => void;
  onSecret: (ok: boolean) => void;
  preview: Preview | undefined;
  project: Project;
  tab: HandTab;
  thread: Message[];
}

export const EditorHand = ({
  composer,
  onApprove,
  onChanges,
  onHand,
  onLimit,
  onPick,
  onSecret,
  preview,
  project,
  tab,
  thread,
}: EditorHandProperties) => (
  <div className="hand">
    <header className="topbar">
      <strong>{project.name}</strong>
      <div className="seg">
        {(
          [
            ["chat", "チャット"],
            ["screen", "画面"],
            ["changes", "変更"],
            ["history", "履歴"],
          ] as const
        ).map(([id, label]) => (
          <button
            className={`seg-opt ${tab === id ? "is-on" : ""}`}
            key={id}
            onClick={() => onHand(id)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </header>
    <section className="hand-page">
      {tab === "chat"
        ? thread.map((message) => (
            <MessageView
              key={message.id}
              message={message}
              onApprove={onApprove}
              onChanges={onChanges}
              onLimit={onLimit}
              onPick={onPick}
              onSecret={onSecret}
              previewName={preview?.title ?? project.name}
            />
          ))
        : null}
      {tab === "screen" ? (
        <div className="phone">
          <h2>{preview?.title ?? project.name}</h2>
          <p className="mono">{preview?.url}</p>
        </div>
      ) : null}
      {tab === "changes" ? <p>会話の変更カードを見てください。</p> : null}
      {tab === "history" ? (
        <p>デスクトップの履歴タブと同じ保存ポイントです。</p>
      ) : null}
    </section>
    <div className="hand-composer">{composer}</div>
    <MobileNav current="editor" />
  </div>
);
