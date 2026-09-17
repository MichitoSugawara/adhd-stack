"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { WorkspaceIcon } from "@/components/shell/workspace-icon";
import type { ChangeSummary } from "@/lib/chat-view";
import {
  KITESURF_CAPTURING_MESSAGE,
  useKitesurfPreview,
} from "@/lib/kitesurf-preview";

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

const PreviewEmpty = ({
  provisioning,
  waiting,
}: {
  provisioning: boolean;
  waiting: boolean;
}) => {
  let title = "アイデアが、形になる場所。";
  let body =
    "チャットで作りたいものを伝えましょう。公開先の URL が用意されると、Kitesurf で動きを確認できます。";
  if (provisioning) {
    title = "環境を準備しています";
    body =
      "公開先の URL ができると、ここで Kitesurf の表示が開きます。環境画面から進捗を確認できます。";
  } else if (waiting) {
    title = "公開の準備をしています";
    body =
      "本番のビルドが完了すると、ここで確認できます。環境画面から進捗を確認できます。";
  }
  return (
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
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
};

const PreviewStatus = ({
  busy,
  imageUrl,
  message,
  status,
}: {
  busy: boolean;
  imageUrl: string | null;
  message: string | null;
  status: "error" | "needs_setup" | "pending" | "ready" | null;
}) => {
  if (imageUrl) {
    return (
      <Image
        alt="プレビューの表示"
        className="studio-browser-shot"
        height={800}
        src={imageUrl}
        unoptimized
        width={1280}
      />
    );
  }
  if (busy || status === "pending") {
    return (
      <div className="studio-preview-empty">
        <p className="ui-eyebrow">KITESURF</p>
        <h2>{KITESURF_CAPTURING_MESSAGE}</h2>
        <p>Cloudflare Browser Run でページを描画しています。</p>
      </div>
    );
  }
  if (status === "needs_setup") {
    return (
      <div className="studio-preview-empty">
        <p className="ui-eyebrow">KITESURF</p>
        <h2>ブラウザプレビューを開けません</h2>
        <p>
          {message ??
            "Cloudflare Browser Run（Kitesurf）の権限がありません。つなぎ直してください。"}
        </p>
        <Link className="ui-button-primary mt-6" href="/connect">
          Cloudflare を接続する
        </Link>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="studio-preview-empty">
        <p className="ui-eyebrow">KITESURF</p>
        <h2>表示を取得できませんでした</h2>
        <p>
          {message ??
            "Kitesurf でページを描画できませんでした。新しいタブで URL を開いて確認できます。"}
        </p>
      </div>
    );
  }
  return (
    <div className="studio-preview-empty">
      <p className="ui-eyebrow">KITESURF</p>
      <h2>表示の準備をしています</h2>
      <p>再読み込みで、Kitesurf の取得をもう一度試せます。</p>
    </div>
  );
};

const KitesurfCanvas = ({
  revision,
  slug,
  url,
  width,
}: {
  revision: number;
  slug: string;
  url: string;
  width: "desktop" | "mobile";
}) => {
  const preview = useKitesurfPreview(slug, url, width, revision);
  return (
    <PreviewStatus
      busy={preview.busy}
      imageUrl={preview.imageUrl}
      message={preview.message}
      status={preview.status}
    />
  );
};

// Visual preview via Cloudflare Browser Run + Kitesurf (browser=kitesurf).
// https://developers.cloudflare.com/browser-run/kitesurf/
export const EditorPreviewPane = ({
  changes,
  pagesUrl,
  previewUrl,
  provisioning = false,
  slug,
  tab,
  onTab,
  waiting,
}: {
  changes: ChangeSummary;
  pagesUrl: string | null;
  previewUrl?: string | null;
  provisioning?: boolean;
  slug?: string;
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
        <span className="studio-pane-meta">
          {url ? "KITESURF" : environmentLabel}
        </span>
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
            <label className="studio-address">
              <WorkspaceIcon name="globe" size={13} />
              <input
                aria-label="プレビューの URL"
                readOnly
                value={url ?? "プレビューはここに表示されます"}
              />
            </label>
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
            {url && slug ? (
              <KitesurfCanvas
                revision={revision}
                slug={slug}
                url={url}
                width={width}
              />
            ) : (
              <PreviewEmpty provisioning={provisioning} waiting={waiting} />
            )}
          </div>
        </>
      )}
    </section>
  );
};
