"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import LoadingState from "@/components/primitives/LoadingState";
import TaskRows from "@/components/primitives/TaskRows";
import type { TaskRow } from "@/components/primitives/TaskRows";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { WorkspaceIcon } from "@/components/shell/workspace-icon";
import { useRetryProvision, useWorkspaceBySlug } from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";
import { hasConvexUrl } from "@/lib/env";
import { isProvisioningStatus } from "@/lib/env-labels";
import { writeLastWorkspace } from "@/lib/last-workspace";
import { hostOf, previewUrlsFrom, publicHttpUrl } from "@/lib/public-url";
import { useShell } from "@/lib/shell-state";

import "./studio.css";

const STEPS = [
  { key: "repo", label: "アプリの保存先", meta: "変更を安全に保存" },
  { key: "template", label: "アプリの土台", meta: "最初の構成を用意" },
  { key: "backend", label: "制作する環境", meta: "AI が作業する場所" },
  { key: "pages", label: "公開先", meta: "アプリを届ける場所" },
  { key: "convex", label: "データの保存先", meta: "アプリのデータを管理" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const statusOf = (value: string | undefined): TaskRow["status"] => {
  if (value === "done") {
    return "done";
  }
  if (value === "error") {
    return "failed";
  }
  if (value === "running") {
    return "running";
  }
  return "waiting";
};

const rowsFromSteps = (
  steps:
    | {
        backend: string;
        convex: string;
        pages: string;
        repo: string;
        template: string;
      }
    | undefined,
  provisionStatus: string
): TaskRow[] => {
  const stepValue = (key: StepKey): string => {
    if (steps) {
      return steps[key];
    }
    if (key === "backend" && provisionStatus === "provisioning") {
      return "running";
    }
    return "pending";
  };
  const rowStatus = (value: string): TaskRow["status"] => {
    if (value === "skipped") {
      return "done";
    }
    return statusOf(value);
  };
  return STEPS.map((step, index) => {
    const value = stepValue(step.key);
    return {
      amount: value === "pending" ? "待ち" : step.meta,
      details: [{ label: step.label, meta: value }],
      key: step.key,
      label: step.label,
      status: rowStatus(value),
      step: index + 1,
    };
  });
};

const CreatingLive = ({ slug }: { slug: string }) => {
  const workspace = useWorkspaceBySlug(slug);
  const retry = useRetryProvision();
  const [retrying, setRetrying] = useState(false);
  const [failNote, setFailNote] = useState<string | null>(null);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    writeLastWorkspace({
      name: workspace.name,
      path: `/p/${slug}/creating`,
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

  const complete = workspace.provisionStatus === "ready";
  const failed = workspace.provisionStatus === "error";
  const provisioning = isProvisioningStatus(workspace.provisionStatus);
  const pages = publicHttpUrl(workspace.cloudflarePagesUrl);
  const previewCount = previewUrlsFrom(
    workspace.cloudflarePreviewUrl,
    workspace.cloudflarePreviewUrls
  ).length;
  let previewLabel = "未作成";
  if (previewCount > 0) {
    previewLabel = "あり";
  } else if (provisioning) {
    previewLabel = "準備中";
  }
  let productionLabel = "未公開";
  if (pages) {
    productionLabel = hostOf(pages);
  } else if (provisioning) {
    productionLabel = "準備中";
  }
  let title = "アイデアのための、場所を用意しています。";
  if (complete) {
    title = "つくる準備が、できました。";
  }
  if (failed) {
    title = "準備を再開しましょう。";
  }
  const handleRetry = async () => {
    setRetrying(true);
    setFailNote(null);
    try {
      await retry({ slug });
    } catch (error) {
      setFailNote(connectErrorMessage(error));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <main className="studio-page">
      <div className="studio-progress-layout">
        <div className="studio-progress-intro">
          <p className="ui-eyebrow">GETTING READY</p>
          <h1>{title}</h1>
          <p>
            「{workspace.name}」の保存先と制作環境を準備します。
            {complete
              ? "エディタを開いて、最初のアイデアを伝えてください。"
              : "この画面を離れても、準備は続きます。"}
          </p>
          <div className="studio-progress-links">
            <Link className="ui-button" href="/projects">
              アプリ一覧に戻る
            </Link>
            <Link className="ui-button" href={`/p/${slug}/envs`}>
              環境を見る
            </Link>
          </div>
        </div>
        <section className="studio-progress-card" aria-label="作成の進捗">
          <h2>{workspace.name}</h2>
          {workspace.provisionStatus === "provisioning" ? (
            <LoadingState label="用意しています" variant="Drive" />
          ) : null}
          <TaskRows
            className="max-w-xl"
            labels={{
              completed: "完了",
              failed: "失敗",
              running: "処理中",
              waiting: "待機",
            }}
            rows={rowsFromSteps(
              workspace.provisionSteps,
              workspace.provisionStatus
            )}
            variant="List"
          />
          {workspace.provisionError ? (
            <p className="text-red max-w-2xl text-[13px]">
              {workspace.provisionError}
            </p>
          ) : null}
          {failNote ? (
            <p className="text-red max-w-2xl text-[13px]">{failNote}</p>
          ) : null}
          <div className="studio-progress-envs" aria-label="環境の状態">
            <p className="ui-eyebrow">ENVIRONMENTS</p>
            <ul>
              <li>プレビュー {previewLabel}</li>
              <li>検証 未提供</li>
              <li>本番 {productionLabel}</li>
            </ul>
          </div>
          <div className="studio-progress-actions">
            <Link className="ui-button" href={`/p/${slug}/envs`}>
              環境を見る
            </Link>
            {complete ? (
              <Link className="ui-button-primary" href={`/p/${slug}`}>
                エディタを開く
              </Link>
            ) : null}
          </div>
          {failed ? (
            <button
              className="ui-button-primary mt-6"
              disabled={retrying}
              onClick={() => {
                void handleRetry();
              }}
              type="button"
            >
              {retrying ? "再開しています…" : "準備をもう一度試す"}
            </button>
          ) : null}
        </section>
      </div>
    </main>
  );
};

const CreatingSkeleton = ({ appId }: { appId: string }) => {
  const { hydrated, state } = useShell();
  const app = state.apps.find((item) => item.id === appId);

  return hydrated && !app ? (
    <main className="px-8 py-10">
      <h1 className="text-[24px] font-semibold">アプリが見つかりません</h1>
    </main>
  ) : (
    <main className="studio-page">
      <div className="studio-progress-layout">
        <div className="studio-progress-intro">
          <p className="ui-eyebrow">UI PREVIEW</p>
          <h1>
            つくる流れを、
            <br />
            見てみましょう。
          </h1>
          <p>
            「{app?.name ?? appId}
            」の画面プレビューです。実行環境は未接続のため、アプリの保存先や公開先は作成されません。
          </p>
          <div className="studio-progress-links">
            <Link className="ui-button" href="/connect">
              接続を確認する
            </Link>
            <Link className="ui-button" href={`/p/${appId}/envs`}>
              環境を見る
            </Link>
          </div>
        </div>
        <section
          className="studio-progress-card"
          aria-label="作成手順のプレビュー"
        >
          <h2>接続後に準備するもの</h2>
          <TaskRows
            className="max-w-xl"
            labels={{
              completed: "完了",
              failed: "失敗",
              running: "処理中",
              waiting: "待機",
            }}
            rows={STEPS.map((step, index) => ({
              amount: "未実行",
              details: [{ label: step.label, meta: step.meta }],
              key: step.key,
              label: step.label,
              status: "waiting",
              step: index + 1,
            }))}
            variant="List"
          />
          <div className="studio-progress-actions">
            <Link className="ui-button" href={`/p/${appId}/envs`}>
              環境を見る
            </Link>
            <Link className="ui-button-primary" href={`/p/${appId}`}>
              編集画面を見る <WorkspaceIcon name="arrow" size={14} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
};

export const CreatingScreen = ({ appId }: { appId: string }) => {
  const live = hasConvexUrl();
  return (
    <ShellGate>
      <AppFrame>
        {live ? (
          <CreatingLive slug={appId} />
        ) : (
          <CreatingSkeleton appId={appId} />
        )}
      </AppFrame>
    </ShellGate>
  );
};
