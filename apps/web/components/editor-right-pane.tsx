"use client";

import {
  BrowserIcon,
  ClockCounterClockwiseIcon,
  CodeIcon,
  ColumnsIcon,
} from "@phosphor-icons/react";

import type { HistoryPoint, Preview, Project } from "../lib/mock-types";
import type { RightTab } from "../lib/right-tab";

interface EditorRightPaneProperties {
  changeBody: string;
  files: string[];
  history: HistoryPoint[];
  onTab: (tab: RightTab) => void;
  preview: Preview | undefined;
  project: Project;
  tab: RightTab;
}

export const EditorRightPane = ({
  changeBody,
  files,
  history,
  onTab,
  preview,
  project,
  tab,
}: EditorRightPaneProperties) => (
  <aside className="editor-pane">
    <div className="tabs">
      <button
        className={`tab ${tab === "browser" ? "is-on" : ""}`}
        onClick={() => onTab("browser")}
        type="button"
      >
        <BrowserIcon size={14} weight="duotone" /> ブラウザ
      </button>
      <button
        className={`tab ${tab === "source" ? "is-on" : ""}`}
        onClick={() => onTab("source")}
        type="button"
      >
        <CodeIcon size={14} weight="duotone" /> ソース
      </button>
      <button
        className={`tab ${tab === "changes" ? "is-on" : ""}`}
        onClick={() => onTab("changes")}
        type="button"
      >
        <ColumnsIcon size={14} weight="duotone" /> 変更
      </button>
      <button
        className={`tab ${tab === "history" ? "is-on" : ""}`}
        onClick={() => onTab("history")}
        type="button"
      >
        <ClockCounterClockwiseIcon size={14} weight="duotone" /> 履歴
      </button>
    </div>
    {tab === "browser" ? (
      <div className="browser">
        <div className="browser-bar">
          <i />
          <i />
          <i />
          <code>{preview?.url ?? "まだありません"}</code>
        </div>
        <div className="browser-page">
          <p className="kicker">{preview?.title ?? "プレビュー"}</p>
          <h2>{project.name}</h2>
          <p>名前・人数・日時を入れる予約の画面です。</p>
          <button className="btn btn-solid" type="button">
            予約する
          </button>
        </div>
      </div>
    ) : null}
    {tab === "source" ? (
      <div className="source">
        <pre>
          {(files.length > 0 ? files : ["apps/web/app/page.tsx"]).join("\n")}
        </pre>
      </div>
    ) : null}
    {tab === "changes" ? (
      <div className="change">
        <pre>{changeBody}</pre>
      </div>
    ) : null}
    {tab === "history" ? (
      <ol className="steps">
        {history.map((point) => (
          <li key={point.id}>
            {point.title}
            <span className="lede"> {point.when}</span>
          </li>
        ))}
      </ol>
    ) : null}
  </aside>
);
