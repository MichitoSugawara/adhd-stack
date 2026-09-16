"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PublishPanel } from "@/components/screens/publish-panel";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useWorkspaceBySlug } from "@/lib/coding-port";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { writeLastWorkspace } from "@/lib/last-workspace";
import { OFFLINE_PUBLISH_NOTE } from "@/lib/publish-copy";
import { usePublishFlow } from "@/lib/publish-flow";

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

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6 lg:px-10">
      <div>
        <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
          本番
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
          本番へ反映
        </h1>
        <p className="text-ink-2 mt-2 text-[14px]">
          いまのあとと、そろったあとを並べます。
        </p>
      </div>
      <PublishPanel
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
        waiting={publishFlow.waiting}
      />
    </main>
  );
};

const PublishOffline = ({ appId }: { appId: string }) => {
  const [publishNote, setPublishNote] = useState<string | null>(null);
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6 lg:px-10">
      <div>
        <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
          本番
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
          本番へ反映
        </h1>
        <p className="text-ink-2 mt-2 text-[14px]">{OFFLINE_PUBLISH_NOTE}</p>
      </div>
      <PublishPanel
        editorHref={`/p/${appId}`}
        error={publishNote}
        hint={OFFLINE_PUBLISH_NOTE}
        onPublish={() => {
          setPublishNote(OFFLINE_PUBLISH_NOTE);
        }}
        pending={false}
      />
      <Link
        className="text-ink-2 text-[13px] underline underline-offset-2"
        href={`/p/${appId}`}
      >
        相談に戻る
      </Link>
    </main>
  );
};

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
