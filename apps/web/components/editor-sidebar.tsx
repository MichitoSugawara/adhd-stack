"use client";

import { Button } from "@cloudflare/kumo";
import {
  ArrowLeftIcon,
  ChatCircleDotsIcon,
  CodeIcon,
  FolderIcon,
  StackIcon,
  TerminalWindowIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import type { EditorRail } from "../lib/editor-copy";
import { MOCK_FILES } from "../lib/mock-copy";

interface EditorSidebarProperties {
  hasCommands: boolean;
  hasDiffs: boolean;
  rail: EditorRail;
  setRail: (rail: EditorRail) => void;
}

export const EditorSidebar = ({
  hasCommands,
  hasDiffs,
  rail,
  setRail,
}: EditorSidebarProperties) => {
  const router = useRouter();
  return (
    <aside className="editor-sidebar">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <StackIcon size={19} weight="bold" />
        </span>
        <span>ADHD Stack</span>
      </div>
      <p className="mock-badge">デモ · ファイル</p>
      <ul className="file-tree">
        {MOCK_FILES.map((file) => (
          <li key={file}>
            <FolderIcon size={14} />
            {file}
          </li>
        ))}
      </ul>
      <nav aria-label="エディターツール">
        <button
          className={`sidebar-item ${rail === "chat" ? "is-active" : ""}`}
          onClick={() => setRail("chat")}
          type="button"
        >
          <ChatCircleDotsIcon size={18} />
          チャット
        </button>
        {hasDiffs ? (
          <button
            className={`sidebar-item ${rail === "files" ? "is-active" : ""}`}
            onClick={() => setRail("files")}
            type="button"
          >
            <CodeIcon size={18} />
            ファイル差分
          </button>
        ) : null}
        {hasCommands ? (
          <button
            className={`sidebar-item ${rail === "commands" ? "is-active" : ""}`}
            onClick={() => setRail("commands")}
            type="button"
          >
            <TerminalWindowIcon size={18} />
            コマンド
          </button>
        ) : null}
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
  );
};
