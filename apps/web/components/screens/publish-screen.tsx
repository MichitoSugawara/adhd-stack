"use client";

import Link from "next/link";
import { useEffect } from "react";

import { PublishPanel } from "@/components/screens/publish-panel";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useWorkspaceBySlug } from "@/lib/coding-port";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { writeLastWorkspace } from "@/lib/last-workspace";
import { OFFLINE_PUBLISH_NOTE } from "@/lib/publish-copy";
import { usePublishFlow } from "@/lib/publish-flow";

import "./studio.css";

const hostingHint = (
  board:
    | {
        connections: readonly {
          provider: string;
          status: string;
        }[];
      }
    | undefined,
  ready: boolean
): string | null => {
  if (!board) {
    return null;
  }
  const missing: string[] = [];
  for (const row of board.connections) {
    if (row.status === "connected") {
      continue;
    }
    if (row.provider === "cloudflare") {
      missing.push("Cloudflare");
    }
    if (row.provider === "convex") {
      missing.push("Convex");
    }
  }
  const parts: string[] = [];
  if (!ready) {
    parts.push("保存先の準備が終わるまで本番へ出せません。");
  }
  if (missing.length > 0) {
    parts.push(`${missing.join(" と ")} がつながっていません。`);
  }
  return parts.length > 0 ? parts.join(" ") : null;
};

const PublishLive = ({ slug }: { slug: string }) => {
  const workspace = useWorkspaceBySlug(slug);
  const { board } = useConnectionsPort();
  const publishFlow = usePublishFlow(slug, workspace);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    writeLastWorkspace({
      name: workspace.name,
      path: `/p/${slug}/publish`,
      slug,
    });
  }, [slug, workspace]);

  if (workspace === undefined) {
    return (
      <main className="px-8 py-10">
        <p className="text-ink-2 text-[14px]">読み込んでいます…</p>
      </main>
    );
  }
  if (workspace === null) {
    return (
      <main className="px-8 py-10">
        <h1 className="text-[24px] font-semibold">アプリが見つかりません</h1>
      </main>
    );
  }

  const hostingConnected =
    board?.authenticated === true && hostingHint(board, true) === null;
  const needsProvisioning = hostingConnected && !workspace.ready;
  const provisioningLabel =
    workspace.provisionStatus === "error"
      ? "準備を再開する"
      : "準備の進捗を見る";

  return (
    <main className="studio-page">
      <div className="studio-progress-layout">
        <div className="studio-progress-intro">
          <p className="ui-eyebrow">READY TO SHARE</p>
          <h1>
            あなたのアイデアを、
            <br />
            外の世界へ。
          </h1>
          <p>
            「{workspace.name}」を公開します。公開したアプリは、URL
            を知っている人がアクセスできます。
          </p>
          <Link className="ui-button" href={`/p/${slug}`}>
            編集に戻る
          </Link>
        </div>
        <PublishPanel
          canPublish={hostingConnected && workspace.ready}
          convexUrl={workspace.convexUrl}
          editorHref={`/p/${slug}`}
          error={publishFlow.error}
          hint={hostingHint(board, workspace.ready)}
          notes={publishFlow.notes}
          onPublish={() => {
            void publishFlow.publish();
          }}
          pagesDeployStatus={publishFlow.pagesDeployStatus}
          pagesUrl={workspace.cloudflarePagesUrl}
          pending={publishFlow.pending}
          recoveryHref={needsProvisioning ? `/p/${slug}/creating` : "/connect"}
          recoveryLabel={
            needsProvisioning ? provisioningLabel : "接続を確認する"
          }
          waiting={publishFlow.waiting}
        />
      </div>
    </main>
  );
};

const PublishOffline = ({ appId }: { appId: string }) => (
  <main className="studio-page">
    <div className="studio-progress-layout">
      <div className="studio-progress-intro">
        <p className="ui-eyebrow">READY TO SHARE</p>
        <h1>
          あなたのアイデアを、
          <br />
          外の世界へ。
        </h1>
        <p>
          公開先を接続すると、ここからアプリを届けられます。現在は画面のプレビューです。
        </p>
        <Link className="ui-button" href={`/p/${appId}`}>
          編集に戻る
        </Link>
      </div>
      <PublishPanel
        canPublish={false}
        editorHref={`/p/${appId}`}
        hint={OFFLINE_PUBLISH_NOTE}
        onPublish={() => {
          /* UI preview cannot publish. */
        }}
        pending={false}
      />
    </div>
  </main>
);

export const PublishScreen = ({ appId }: { appId: string }) => {
  const live = hasConvexUrl();
  return (
    <ShellGate>
      <AppFrame>
        {live ? <PublishLive slug={appId} /> : <PublishOffline appId={appId} />}
      </AppFrame>
    </ShellGate>
  );
};
