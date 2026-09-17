"use client";

import Link from "next/link";
import { useEffect } from "react";

import { EnvCard } from "@/components/screens/env-card";
import { StatusChip } from "@/components/screens/status-chip";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { WorkspaceIcon } from "@/components/shell/workspace-icon";
import { useWorkspaceBySlug } from "@/lib/coding-port";
import { hasConvexUrl } from "@/lib/env";
import { writeLastWorkspace } from "@/lib/last-workspace";
import { hostOf, previewUrlsFrom, publicHttpUrl } from "@/lib/public-url";
import { CONVEX_FUNCTION_PUSH_NOTE } from "@/lib/publish-copy";
import { useSyncPagesEnvironments } from "@/lib/publish-flow";
import { useShell } from "@/lib/shell-state";

import "./studio.css";

interface ProductionState {
  body: string;
  label: string;
  tone: "idle" | "ok" | "wait";
}

const productionState = (
  pages: string | null,
  started: boolean
): ProductionState => {
  if (started) {
    return {
      body: "本番のビルドを実行中です。公開の完了を待っています。",
      label: "ビルド中",
      tone: "wait",
    };
  }
  if (pages) {
    return {
      body: "みんなに届けるアプリの URL です。変更は、公開の操作をすると反映されます。",
      label: "URL あり",
      tone: "ok",
    };
  }
  return {
    body: "できあがったアプリを公開する場所です。まだ公開されていません。",
    label: "未公開",
    tone: "idle",
  };
};

const EnvColumns = ({
  slug,
  pages,
  previews,
  started,
  offline = false,
}: {
  slug: string;
  pages: string | null;
  previews: readonly string[];
  started: boolean;
  offline?: boolean;
}) => {
  const production = productionState(pages, started);
  return (
    <div className="studio-env-grid">
      <section className="studio-env-card">
        <span className="studio-env-number">01 / TRY IT</span>
        <div className="studio-env-card-header">
          <h2>プレビュー</h2>
          <StatusChip tone={previews.length ? "ok" : "idle"}>
            {previews.length ? `${previews.length} 件` : "未作成"}
          </StatusChip>
        </div>
        <p>
          {previews.length
            ? "制作中のアプリを開いて、使い心地を確かめましょう。"
            : "制作中のアプリを試す場所です。プレビューの URL はまだありません。"}
        </p>
        <div className="studio-env-preview-list">
          {previews.map((url) => (
            <a
              className="studio-env-link"
              href={url}
              key={url}
              rel="noreferrer"
              target="_blank"
            >
              {hostOf(url)}{" "}
              <WorkspaceIcon
                name="arrow"
                size={13}
                style={{ transform: "rotate(-45deg)" }}
              />
            </a>
          ))}
        </div>
        <div className="studio-env-actions">
          <Link className="ui-button" href={`/p/${slug}`}>
            編集を続ける <WorkspaceIcon name="arrow" size={14} />
          </Link>
        </div>
      </section>
      <EnvCard
        body="公開前の最終確認をする場所です。検証環境の作成と本番への反映は、まだ利用できません。"
        number="02 / REVIEW"
        status="未提供"
        title="検証"
        tone="idle"
      />
      <EnvCard
        actions={
          offline ? (
            <Link className="ui-button" href="/connect">
              接続を確認する
            </Link>
          ) : (
            <Link className="ui-button-primary" href={`/p/${slug}/publish`}>
              {started ? "公開の進捗を見る" : "公開の設定へ"}{" "}
              <WorkspaceIcon
                name="arrow"
                size={14}
                style={{ transform: "rotate(-45deg)" }}
              />
            </Link>
          )
        }
        body={production.body}
        number="03 / SHARE"
        status={production.label}
        title="本番"
        tone={production.tone}
        url={pages}
      />
    </div>
  );
};

const EnvsLive = ({ slug }: { slug: string }) => {
  const workspace = useWorkspaceBySlug(slug);
  useSyncPagesEnvironments(slug, workspace?.ready === true);
  useEffect(() => {
    if (workspace) {
      writeLastWorkspace({
        name: workspace.name,
        path: `/p/${slug}/envs`,
        slug,
      });
    }
  }, [slug, workspace]);
  if (workspace === undefined) {
    return <p className="studio-muted">読み込んでいます…</p>;
  }
  if (workspace === null) {
    return (
      <div className="studio-page-heading">
        <h1>アプリが見つかりません</h1>
        <Link className="ui-button" href="/projects">
          アプリ一覧に戻る
        </Link>
      </div>
    );
  }
  const pages = publicHttpUrl(workspace.cloudflarePagesUrl);
  const previews = previewUrlsFrom(
    workspace.cloudflarePreviewUrl,
    workspace.cloudflarePreviewUrls
  );
  const convex = publicHttpUrl(workspace.convexUrl);
  const started = workspace.pagesDeployStatus === "started";
  return (
    <>
      <div className="studio-page-heading">
        <div>
          <p className="ui-eyebrow">ENVIRONMENTS</p>
          <h1>試して、確かめて、届ける。</h1>
          <p>「{workspace.name}」の公開先と、いまの状態。</p>
        </div>
        <Link className="ui-button" href={`/p/${slug}`}>
          編集に戻る
        </Link>
      </div>
      <EnvColumns
        pages={pages}
        previews={previews}
        slug={slug}
        started={started}
      />
      {workspace.publishError ? (
        <p className="studio-error" role="alert">
          {workspace.publishError}
        </p>
      ) : null}
      {workspace.publishNotes?.map((note) => (
        <p className="studio-env-note" key={note}>
          {note}
        </p>
      ))}
      {convex ? (
        <p className="studio-env-note">{CONVEX_FUNCTION_PUSH_NOTE}</p>
      ) : null}
      <p className="studio-env-note">
        新しいプレビューの作成、検証への反映、公開履歴から前の版に戻す操作は、現在は利用できません。
      </p>
    </>
  );
};

const EnvsOffline = ({ slug, title }: { slug: string; title: string }) => (
  <>
    <div className="studio-page-heading">
      <div>
        <p className="ui-eyebrow">ENVIRONMENTS</p>
        <h1>試して、確かめて、届ける。</h1>
        <p>
          「{title}」の環境。これは UI
          プレビューです。実行環境はまだ接続されていません。
        </p>
      </div>
      <Link className="ui-button" href={`/p/${slug}`}>
        編集に戻る
      </Link>
    </div>
    <EnvColumns
      offline
      pages={null}
      previews={[]}
      slug={slug}
      started={false}
    />
  </>
);

export const EnvsScreen = ({ appId }: { appId: string }) => {
  const shell = useShell();
  const app = shell.state.apps.find((item) => item.id === appId);
  return (
    <ShellGate>
      <AppFrame>
        <main className="studio-page">
          <div className="studio-page-inner">
            {hasConvexUrl() ? (
              <EnvsLive slug={appId} />
            ) : (
              <EnvsOffline slug={appId} title={app?.name ?? appId} />
            )}
          </div>
        </main>
      </AppFrame>
    </ShellGate>
  );
};
