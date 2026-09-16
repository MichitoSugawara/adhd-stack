"use client";

import { UrlChip } from "@/components/screens/url-chip";
import type { ChangeSummary } from "@/lib/chat-view";
import { ENV_LABEL, PREVIEW_UNAVAILABLE } from "@/lib/env-labels";

type PreviewTab = "preview" | "source";

export const EditorPreviewPane = ({
  changes,
  onTab,
  pagesUrl,
  tab,
  waiting,
}: {
  changes: ChangeSummary;
  onTab: (tab: PreviewTab) => void;
  pagesUrl: string | null;
  tab: PreviewTab;
  waiting: boolean;
}) => (
  <aside className="border-line hidden min-h-0 w-[380px] shrink-0 flex-col border-l xl:flex">
    <div className="border-line flex gap-1 border-b p-2">
      <button
        className={`rounded-control h-8 px-3 text-[12px] font-medium ${
          tab === "preview" ? "bg-field text-ink" : "text-ink-3"
        }`}
        onClick={() => {
          onTab("preview");
        }}
        type="button"
      >
        プレビュー
      </button>
      <button
        className={`rounded-control h-8 px-3 text-[12px] font-medium ${
          tab === "source" ? "bg-field text-ink" : "text-ink-3"
        }`}
        onClick={() => {
          onTab("source");
        }}
        type="button"
      >
        ソース
      </button>
    </div>
    {tab === "preview" ? (
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
        <p className="text-ink-3 text-[12px] leading-5">
          {PREVIEW_UNAVAILABLE}
        </p>
        {pagesUrl ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-ink-2 text-[12px]">
                {ENV_LABEL.production}
              </span>
              <UrlChip href={pagesUrl} waiting={waiting} />
            </div>
            {waiting ? (
              <p className="text-ink-3 text-[12px]">
                本番の組み立てを待っています。完了はまだ見ていません。
              </p>
            ) : (
              <iframe
                className="bg-inset rounded-card min-h-[280px] w-full flex-1"
                src={pagesUrl}
                title={`${ENV_LABEL.production}の表示`}
              />
            )}
          </>
        ) : (
          <p className="text-ink-3 text-[13px]">
            本番のページもまだありません。
          </p>
        )}
      </div>
    ) : (
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3">
        <p className="text-ink-3 text-[12px] leading-5">
          ソースはファイル名と変更の数だけ出します。
        </p>
        {changes.files.length === 0 ? (
          <p className="text-ink-3 text-[13px]">
            まだファイルの変更はありません。
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {changes.files.map((file) => (
              <li
                className="rounded-card bg-inset px-2.5 py-2 text-[12px]"
                key={file}
              >
                {file}
              </li>
            ))}
          </ul>
        )}
      </div>
    )}
  </aside>
);
