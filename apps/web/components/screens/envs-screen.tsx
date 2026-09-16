"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useWorkspaceBySlug } from "@/lib/coding-port";
import { hasConvexUrl } from "@/lib/env";
import { writeLastWorkspace } from "@/lib/last-workspace";
import { publicHttpUrl } from "@/lib/public-url";
import { CONVEX_FUNCTION_PUSH_NOTE } from "@/lib/publish-copy";
import { useShell } from "@/lib/shell-state";

const EnvsLive = ({ slug }: { slug: string }) => {
  const workspace = useWorkspaceBySlug(slug);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    writeLastWorkspace({
      name: workspace.name,
      path: `/p/${slug}/envs`,
      slug,
    });
  }, [slug, workspace]);

  if (workspace === undefined) {
    return <p className="text-ink-2 mt-2 text-[14px]">読み込んでいます…</p>;
  }
  if (workspace === null) {
    return (
      <h1 className="mt-2 text-[24px] font-semibold">アプリが見つかりません</h1>
    );
  }
  const pages = publicHttpUrl(workspace.cloudflarePagesUrl);
  const convex = publicHttpUrl(workspace.convexUrl);

  return (
    <>
      <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
        {workspace.name}
      </h1>
      <p className="shell-note max-w-2xl">
        公開は一本です。操作はチャット画面です。
      </p>
      <div className="rounded-card bg-surface shadow-card max-w-2xl p-4 text-[13px] leading-6">
        <p>
          <span className="text-ink-3">Pages</span>
          {pages ? (
            <a
              className="text-ink ml-2 break-all underline underline-offset-2"
              href={pages}
              rel="noreferrer"
              target="_blank"
            >
              {pages}
            </a>
          ) : (
            <span className="text-ink-2 ml-2">まだありません</span>
          )}
        </p>
        <p className="mt-1">
          <span className="text-ink-3">Convex</span>
          {convex ? (
            <a
              className="text-ink ml-2 break-all underline underline-offset-2"
              href={convex}
              rel="noreferrer"
              target="_blank"
            >
              {convex}
            </a>
          ) : (
            <span className="text-ink-2 ml-2">まだありません</span>
          )}
        </p>
        {workspace.pagesDeployStatus === "started" ? (
          <p className="text-ink-2 mt-3">
            Pages をビルドしています。完了はまだ見ていません。
          </p>
        ) : null}
        {convex ? (
          <p className="text-ink-2 mt-3">{CONVEX_FUNCTION_PUSH_NOTE}</p>
        ) : null}
        {workspace.publishNotes?.map((note) => (
          <p className="text-ink-2 mt-2" key={note}>
            {note}
          </p>
        ))}
        {workspace.publishError ? (
          <p className="text-red mt-3">{workspace.publishError}</p>
        ) : null}
      </div>
    </>
  );
};

export const EnvsScreen = ({ appId }: { appId: string }) => {
  const live = hasConvexUrl();
  const shell = useShell();
  const app = shell.state.apps.find((item) => item.id === appId);
  const title = app?.name ?? appId;

  return (
    <ShellGate>
      <AppFrame>
        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-auto px-6 py-6 lg:px-10">
          <div>
            <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
              環境
            </p>
            {live ? (
              <EnvsLive slug={appId} />
            ) : (
              <>
                <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
                  {title}
                </h1>
                <p className="shell-note max-w-2xl">
                  Convex 未設定のため URL は出しません。公開はチャット画面です。
                </p>
              </>
            )}
          </div>
          <Link
            className="rounded-control bg-ink text-surface h-10 w-fit px-4 text-[13px] leading-10 font-medium"
            href={`/p/${appId}`}
          >
            チャットへ戻る
          </Link>
        </main>
      </AppFrame>
    </ShellGate>
  );
};
