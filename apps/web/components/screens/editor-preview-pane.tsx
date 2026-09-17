"use client";

import { useState } from "react";

import { WorkspaceIcon } from "@/components/shell/workspace-icon";
import type { ChangeSummary } from "@/lib/chat-view";
import { hostOf } from "@/lib/public-url";

export type EditorSideTab = "changes" | "preview";

const BrowserIcon = ({
  kind,
}: {
  kind: "desktop" | "external" | "mobile" | "reload";
}) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="16"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.6"
    viewBox="0 0 24 24"
    width="16"
  >
    {kind === "desktop" ? (
      <>
        <rect height="13" rx="2" width="18" x="3" y="3" />
        <path d="M8 21h8m-4-5v5" />
      </>
    ) : null}
    {kind === "mobile" ? (
      <>
        <rect height="20" rx="2" width="12" x="6" y="2" />
        <path d="M11 18h2" />
      </>
    ) : null}
    {kind === "reload" ? (
      <>
        <path d="M20 7v5h-5" />
        <path d="M19 12a7 7 0 1 0-1.6 4.5M20 7l-2.6-2" />
      </>
    ) : null}
    {kind === "external" ? (
      <>
        <path d="M14 3h7v7m0-7L10 14" />
        <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
      </>
    ) : null}
  </svg>
);

// Kitesurf's chat + browser composition, with only real environment URLs.
export const EditorPreviewPane = ({
  changes,
  pagesUrl,
  previewUrl,
  tab,
  onTab,
  waiting,
}: {
  changes: ChangeSummary;
  pagesUrl: string | null;
  previewUrl?: string | null;
  tab: EditorSideTab;
  onTab: (tab: EditorSideTab) => void;
  waiting: boolean;
}) => {
  const [width, setWidth] = useState<"desktop" | "mobile">("desktop");
  const [revision, setRevision] = useState(0);
  const url = previewUrl ?? (waiting ? null : pagesUrl);
  let environmentLabel = "YOUR APP";
  if (url) {
    environmentLabel = "PRODUCTION";
  }
  if (previewUrl) {
    environmentLabel = "PREVIEW";
  }

  return (
    <section className="studio-preview" aria-label="アプリのプレビュー">
      <div className="studio-pane-heading">
        <div className="studio-pane-tabs" aria-label="プレビューの表示">
          <button
            aria-pressed={tab === "preview"}
            className={tab === "preview" ? "is-active" : ""}
            onClick={() => onTab("preview")}
            type="button"
          >
            プレビュー
          </button>
          {changes.files.length > 0 ? (
            <button
              aria-pressed={tab === "changes"}
              className={tab === "changes" ? "is-active" : ""}
              onClick={() => onTab("changes")}
              type="button"
            >
              変更 <span>{changes.files.length}</span>
            </button>
          ) : null}
        </div>
        <span className="studio-pane-meta">{environmentLabel}</span>
      </div>
      {tab === "changes" ? (
        <div className="studio-changes">
          <p className="ui-eyebrow">変更されたファイル</p>
          <h2>{changes.files.length} 件の変更</h2>
          <p>
            追加 {changes.add} 行 · 削除 {changes.del} 行
          </p>
          <ul>
            {changes.files.map((file) => (
              <li key={file}>
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                  width="15"
                >
                  <path d="M5 3h9l5 5v13H5zM14 3v6h5M9 13h6M9 17h6" />
                </svg>
                <code>{file}</code>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <div className="studio-browser-toolbar">
            {url ? (
              <button
                aria-label="プレビューを再読み込み"
                className="ui-icon-button"
                onClick={() => setRevision((value) => value + 1)}
                title="再読み込み"
                type="button"
              >
                <BrowserIcon kind="reload" />
              </button>
            ) : null}
            <div className="studio-address">
              <WorkspaceIcon name="globe" size={13} />
              <span>
                {url ? hostOf(url) : "プレビューはここに表示されます"}
              </span>
            </div>
            <div
              className="studio-width-control"
              aria-label="プレビューの画面サイズ"
            >
              <button
                aria-label="デスクトップ幅"
                aria-pressed={width === "desktop"}
                className={width === "desktop" ? "is-active" : ""}
                onClick={() => setWidth("desktop")}
                title="デスクトップ幅"
                type="button"
              >
                <BrowserIcon kind="desktop" />
              </button>
              <button
                aria-label="モバイル幅"
                aria-pressed={width === "mobile"}
                className={width === "mobile" ? "is-active" : ""}
                onClick={() => setWidth("mobile")}
                title="モバイル幅"
                type="button"
              >
                <BrowserIcon kind="mobile" />
              </button>
            </div>
            {url ? (
              <a
                aria-label="プレビューを新しいタブで開く"
                className="ui-icon-button"
                href={url}
                rel="noreferrer"
                target="_blank"
                title="新しいタブで開く"
              >
                <BrowserIcon kind="external" />
              </a>
            ) : null}
          </div>
          <div
            className={`studio-browser-canvas${width === "mobile" ? " is-mobile" : ""}`}
          >
            {url ? (
              <iframe
                className="studio-browser-frame"
                key={`${url}-${revision}`}
                src={url}
                title={previewUrl ? "プレビューの表示" : "本番の表示"}
              />
            ) : (
              <div className="studio-preview-empty">
                <div className="studio-blueprint" aria-hidden="true">
                  <div className="studio-blueprint-bar">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="studio-blueprint-body">
                    <div />
                    <div />
                    <div />
                  </div>
                  <span>YOUR NEXT IDEA</span>
                </div>
                <span className="ui-eyebrow">A LITTLE IDEA, A REAL APP.</span>
                <h2>
                  {waiting
                    ? "公開の準備をしています"
                    : "アイデアが、形になる場所。"}
                </h2>
                <p>
                  {waiting
                    ? "本番のビルドが完了すると、ここで確認できます。環境画面から進捗を確認できます。"
                    : "チャットで作りたいものを伝えましょう。プレビューの URL が用意されると、ここで動きを確認できます。"}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};
