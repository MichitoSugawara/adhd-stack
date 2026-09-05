"use client";

import type { ReactNode } from "react";

import type { Message, Preview, Project } from "../lib/mock-types";
import { MessageView } from "./message-view";
import { MobileNav } from "./mobile-nav";

export type HandTab = "changes" | "chat" | "screen";

interface EditorHandProperties {
  composer: ReactNode;
  onApprove: () => void;
  onHand: (tab: HandTab) => void;
  onOverlap: () => void;
  onPick: (option: string) => void;
  onSecret: () => void;
  preview: Preview | undefined;
  project: Project;
  tab: HandTab;
  thread: Message[];
}

export const EditorHand = ({
  composer,
  onApprove,
  onHand,
  onOverlap,
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
      <div className="filters">
        <button
          className={`btn ${tab === "chat" ? "btn-solid" : "btn-ghost"}`}
          onClick={() => onHand("chat")}
          type="button"
        >
          会話
        </button>
        <button
          className={`btn ${tab === "screen" ? "btn-solid" : "btn-ghost"}`}
          onClick={() => onHand("screen")}
          type="button"
        >
          画面
        </button>
        <button
          className={`btn ${tab === "changes" ? "btn-solid" : "btn-ghost"}`}
          onClick={() => onHand("changes")}
          type="button"
        >
          変更
        </button>
      </div>
    </header>
    <section className="hand-page">
      {tab === "chat"
        ? thread.map((message) => (
            <MessageView
              key={message.id}
              message={message}
              onApprove={onApprove}
              onOverlap={onOverlap}
              onPick={onPick}
              onSecret={onSecret}
            />
          ))
        : null}
      {tab === "screen" ? (
        <div className="browser">
          <div className="browser-bar">
            <i />
            <i />
            <i />
            <code>{preview?.url ?? "まだありません"}</code>
          </div>
          <div className="browser-page">
            <h2>{preview?.title ?? project.name}</h2>
            <p>{preview?.url}</p>
          </div>
        </div>
      ) : null}
      {tab === "changes" ? <p>会話の変更カードを見てください。</p> : null}
    </section>
    <div className="hand-composer">{composer}</div>
    <MobileNav current="editor" />
  </div>
);
