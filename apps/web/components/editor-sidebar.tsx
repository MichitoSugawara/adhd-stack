"use client";

import {
  ChatCircleDotsIcon,
  CodeIcon,
  FileIcon,
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
    <aside className="ide-sidebar">
      <p className="chapter">
        <em>03</em> FILES
      </p>
      <p className="mock-badge">デモ · ファイル</p>
      <ul className="file-tree">
        {MOCK_FILES.map((file) => (
          <li key={file}>
            <FileIcon size={12} />
            <span>{file}</span>
          </li>
        ))}
      </ul>
      <nav aria-label="エディターツール">
        <button
          className={`sidebar-item ${rail === "chat" ? "is-active" : ""}`}
          onClick={() => setRail("chat")}
          type="button"
        >
          <ChatCircleDotsIcon size={16} />
          活動
        </button>
        {hasDiffs ? (
          <button
            className={`sidebar-item ${rail === "files" ? "is-active" : ""}`}
            onClick={() => setRail("files")}
            type="button"
          >
            <CodeIcon size={16} />
            差分
          </button>
        ) : null}
        {hasCommands ? (
          <button
            className={`sidebar-item ${rail === "commands" ? "is-active" : ""}`}
            onClick={() => setRail("commands")}
            type="button"
          >
            <TerminalWindowIcon size={16} />
            コマンド
          </button>
        ) : null}
      </nav>
      <button
        className="atelier-btn atelier-btn--ghost"
        onClick={() => router.push("/")}
        type="button"
      >
        カタログへ
      </button>
    </aside>
  );
};
