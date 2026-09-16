"use client";

import { UrlChip } from "@/components/screens/url-chip";
import type { ChangeSummary } from "@/lib/chat-view";
import {
  ENV_LABEL,
  HISTORY_UNAVAILABLE,
  PREVIEW_UNAVAILABLE,
  changeNoteFrom,
} from "@/lib/env-labels";

export type EditorSideTab = "changes" | "history" | "preview" | "source";

const ProductionPreview = ({
  pagesUrl,
  previewUrl,
  waiting,
}: {
  pagesUrl: string | null;
  previewUrl?: string | null;
  waiting: boolean;
}) => {
  if (!pagesUrl) {
    return (
      <p className="text-ink-3 text-[13px]">本番のページもまだありません。</p>
    );
  }
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-ink-2 text-[12px]">{ENV_LABEL.production}</span>
        <UrlChip href={pagesUrl} waiting={waiting} />
      </div>
      {waiting ? (
        <p className="text-ink-3 text-[12px]">
          本番の組み立てを待っています。完了はまだ見ていません。
        </p>
      ) : null}
      {waiting || previewUrl ? null : (
        <iframe
          className="bg-inset rounded-card min-h-[280px] w-full flex-1"
          src={pagesUrl}
          title={`${ENV_LABEL.production}の表示`}
        />
      )}
    </>
  );
};

const PreviewBody = ({
  pagesUrl,
  previewUrl,
  waiting,
}: {
  pagesUrl: string | null;
  previewUrl?: string | null;
  waiting: boolean;
}) => (
  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-3">
    {previewUrl ? (
      <>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-ink-2 text-[12px]">{ENV_LABEL.preview}</span>
          <UrlChip href={previewUrl} />
        </div>
        <iframe
          className="bg-inset rounded-card min-h-[280px] w-full flex-1"
          src={previewUrl}
          title={`${ENV_LABEL.preview}の表示`}
        />
      </>
    ) : (
      <p className="text-ink-3 text-[12px] leading-5">{PREVIEW_UNAVAILABLE}</p>
    )}
    <ProductionPreview
      pagesUrl={pagesUrl}
      previewUrl={previewUrl}
      waiting={waiting}
    />
  </div>
);

const SourceBody = ({ changes }: { changes: ChangeSummary }) => (
  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3">
    <p className="text-ink-3 text-[12px] leading-5">
      ソースはファイル名と変更の数だけ出します。
    </p>
    {changes.files.length === 0 ? (
      <p className="text-ink-3 text-[13px]">まだファイルの変更はありません。</p>
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
);

const ChangesBody = ({ changes }: { changes: ChangeSummary }) => (
  <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-3">
    <p className="text-ink-2 text-[13px] leading-6">
      {changeNoteFrom(changes)}
    </p>
    {changes.files.length === 0 ? null : (
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
);

export const EditorPreviewPane = ({
  changes,
  pagesUrl,
  previewUrl,
  tab,
  waiting,
}: {
  changes: ChangeSummary;
  pagesUrl: string | null;
  previewUrl?: string | null;
  tab: EditorSideTab;
  waiting: boolean;
}) => {
  if (tab === "source") {
    return (
      <aside className="border-line hidden min-h-0 w-[380px] shrink-0 flex-col border-l xl:flex">
        <SourceBody changes={changes} />
      </aside>
    );
  }
  if (tab === "changes") {
    return (
      <aside className="border-line hidden min-h-0 w-[380px] shrink-0 flex-col border-l xl:flex">
        <ChangesBody changes={changes} />
      </aside>
    );
  }
  if (tab === "history") {
    return (
      <aside className="border-line hidden min-h-0 w-[380px] shrink-0 flex-col border-l xl:flex">
        <div className="p-3">
          <p className="text-ink-3 text-[13px] leading-6">
            {HISTORY_UNAVAILABLE}
          </p>
        </div>
      </aside>
    );
  }
  return (
    <aside className="border-line hidden min-h-0 w-[380px] shrink-0 flex-col border-l xl:flex">
      <PreviewBody
        pagesUrl={pagesUrl}
        previewUrl={previewUrl}
        waiting={waiting}
      />
    </aside>
  );
};
