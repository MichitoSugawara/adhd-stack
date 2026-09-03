"use client";

import { Button } from "@cloudflare/kumo";

import { provisionHeadline } from "../lib/editor-copy";
import type { MockWorkspace } from "../lib/mock-types";

interface EditorProvisionStripProperties {
  onRetry: () => void;
  workspace: MockWorkspace | null;
}

export const EditorProvisionStrip = ({
  onRetry,
  workspace,
}: EditorProvisionStripProperties) => (
  <div className="provision-strip">
    <p className="provision-strip-headline">{provisionHeadline(workspace)}</p>
    <p>
      <span className="editor-label">REPO</span>
      {workspace?.githubRepoUrl ? (
        <span>
          {workspace.githubRepoUrl}
          <em className="mock-inline">モック</em>
        </span>
      ) : (
        "準備中"
      )}
    </p>
    <p>
      <span className="editor-label">ENV</span>
      {workspace?.codexEnvironmentId ??
        (workspace?.provisionStatus === "error" ? "未作成" : "準備中")}
    </p>
    <p>
      <span className="editor-label">PAGES</span>
      {workspace?.cloudflarePagesUrl ?? "—"}
    </p>
    <p>
      <span className="editor-label">CONVEX</span>
      {workspace?.convexUrl ?? "—"}
    </p>
    {workspace?.provisionStatus === "error" ? (
      <Button onClick={onRetry} size="sm" variant="secondary">
        再試行
      </Button>
    ) : null}
  </div>
);
