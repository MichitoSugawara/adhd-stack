"use client";

import { Button } from "@cloudflare/kumo";

import type { Doc } from "../../../convex/_generated/dataModel";
import { provisionHeadline } from "../lib/editor-copy";

interface EditorProvisionStripProperties {
  onRetry: () => void;
  workspace:
    | Pick<
        Doc<"workspaces">,
        | "cloudflarePagesUrl"
        | "codexEnvironmentId"
        | "convexUrl"
        | "githubRepoUrl"
        | "provisionStatus"
      >
    | null
    | undefined;
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
        <a href={workspace.githubRepoUrl} rel="noreferrer" target="_blank">
          {workspace.githubRepoUrl}
        </a>
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
