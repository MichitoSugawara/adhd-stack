"use client";

import Link from "next/link";

import { WorkspaceIcon } from "@/components/shell/workspace-icon";
import type { ChangeSummary } from "@/lib/chat-view";

const productionState = (
  pagesUrl: string | null,
  waiting: boolean,
  provisioning: boolean
) => {
  if (waiting) {
    return { dot: " is-waiting", label: "ビルド中" };
  }
  if (pagesUrl) {
    return { dot: " is-live", label: "URL あり" };
  }
  if (provisioning) {
    return { dot: " is-waiting", label: "準備中" };
  }
  return { dot: "", label: "未公開" };
};

// OpenTUI's compact status-line hierarchy, adapted for a browser workspace.
export const EditorEnvRail = ({
  changes,
  envsHref,
  pagesUrl,
  previewUrls,
  provisioning = false,
  waiting,
}: {
  changes: ChangeSummary;
  envsHref: string;
  pagesUrl: string | null;
  previewUrls: readonly string[];
  provisioning?: boolean;
  waiting: boolean;
}) => {
  const production = productionState(pagesUrl, waiting, provisioning);
  let previewLabel = "未作成";
  let previewDot = "";
  if (previewUrls.length) {
    previewLabel = "あり";
    previewDot = " is-live";
  } else if (provisioning) {
    previewLabel = "準備中";
    previewDot = " is-waiting";
  }
  return (
    <footer className="studio-status" aria-label="環境の状態">
      <span className="studio-status-item">
        <span className={`studio-dot${previewDot}`} />
        プレビュー {previewLabel}
      </span>
      <span className="studio-status-item">
        <span className={`studio-dot${production.dot}`} />
        本番 {production.label}
      </span>
      {changes.files.length > 0 ? (
        <span>{changes.files.length} ファイル変更</span>
      ) : null}
      <Link href={envsHref}>
        環境を管理{" "}
        <WorkspaceIcon
          name="arrow"
          size={11}
          style={{ transform: "rotate(-45deg)" }}
        />
      </Link>
    </footer>
  );
};
