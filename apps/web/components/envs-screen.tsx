"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import type { Preview } from "../lib/mock-types";
import { previewTagClass } from "../lib/preview-ui";
import { NeedSession } from "./need-session";
import { OverlapDialog } from "./overlap-dialog";
import { StackChrome } from "./stack-chrome";
import { Toast } from "./toast";

interface EnvsScreenProperties {
  projectId: string;
}

export const EnvsScreen = ({ projectId }: EnvsScreenProperties) => {
  const app = useMockApp();
  const router = useRouter();
  const project = app.state.projects.find((item) => item.id === projectId);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const drafts: Preview[] = [];
  for (const item of app.state.previews) {
    if (item.projectId === projectId && item.kind === "draft") {
      drafts.push(item);
    }
  }

  if (app.hydrated && !app.state.session) {
    return <NeedSession />;
  }

  if (!project) {
    return (
      <main className={`stack ${fontVariables}`}>
        <StackChrome />
        <section className="page">
          <h1>見つかりません</h1>
        </section>
      </main>
    );
  }

  const newer = app.state.staging > app.state.prod;
  const [activeDraft] = drafts;

  return (
    <main className={`stack ${fontVariables}`}>
      <StackChrome />
      <section className="page">
        <p className="kicker">プロジェクト ／ {project.name} ／ 環境</p>
        <div className="page-head">
          <h1>環境</h1>
          <button
            className="btn btn-primary"
            onClick={() => router.push(`/p/${projectId}`)}
            type="button"
          >
            ＋ 新しいプレビュー
          </button>
        </div>
        {app.state.deployFailed ? (
          <div className="card fail-card">
            <strong>本番は v{app.state.prod} のまま動いています。</strong>
            <p>
              反映中にメール送信の鍵（RESEND_API_KEY）が見つかりませんでした。
            </p>
            <pre className="fail-log mono">
              {`error: missing RESEND_API_KEY
deploy aborted
staging v${app.state.staging} unchanged
prod v${app.state.prod} healthy
`}
            </pre>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button
                className="btn btn-primary"
                onClick={() =>
                  app.write((prev) => ({ ...prev, deployFailed: false }))
                }
                type="button"
              >
                キーを入れてやり直す
              </button>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  app.write((prev) => ({ ...prev, deployFailed: false }))
                }
                type="button"
              >
                AI に直させる
              </button>
              <button
                className="btn btn-ghost"
                onClick={() =>
                  app.write((prev) => ({ ...prev, deployFailed: false }))
                }
                type="button"
              >
                今回はやめる
              </button>
            </div>
          </div>
        ) : null}
        <div className="envs">
          <section className="lane">
            <div className="lane-head">
              <span className="side-dot" />
              <h2>プレビュー</h2>
            </div>
            <p className="lede">自由に作って壊せる</p>
            {drafts.map((item) => (
              <article className="card" key={item.id}>
                <strong>{item.title}</strong>
                <span className={previewTagClass(item.state)}>
                  {item.state}
                </span>
                <p className="mono">{item.url}</p>
                <p className="lede">
                  {item.savepoints.length > 0
                    ? `${item.savepoints.length}つの保存ポイント · 最新: ${item.savepoints[0]?.title}`
                    : "保存ポイントなし"}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      router.push(`/p/${projectId}?preview=${item.id}`)
                    }
                    type="button"
                  >
                    開く
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => app.promote(item.id, "review")}
                    style={{
                      opacity:
                        item.state === "反映済み" || item.state === "作業中"
                          ? 1
                          : 0.45,
                    }}
                    type="button"
                  >
                    検証へ送る
                  </button>
                </div>
              </article>
            ))}
          </section>
          <section className="lane">
            <div className="lane-head">
              <span
                className="side-dot"
                style={{ background: "var(--color-neutral-500)" }}
              />
              <h2>検証 v{app.state.staging}</h2>
            </div>
            <p className="lede">{newer ? "本番より新しい" : "本番と同じ"}</p>
            <article className="card">
              <span className="tag tag-neutral">
                {newer ? "本番より新しい" : "本番と同じ"}
              </span>
              <p className="mono">staging.adhd.gawarago.com</p>
              <p className="lede">
                {newer ? "本番との差 4ファイル" : "差なし"}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (newer) {
                    setPromoteOpen(true);
                    return;
                  }
                  app.toast("本番と検証は同じ版です");
                }}
                style={{ opacity: newer ? 1 : 0.45 }}
                type="button"
              >
                本番へ反映
              </button>
            </article>
          </section>
          <section className="lane">
            <div className="lane-head">
              <span
                className="side-dot"
                style={{ background: "var(--color-text)" }}
              />
              <h2>本番 v{app.state.prod}</h2>
            </div>
            <p className="lede">公開中</p>
            <article className="card elev-md">
              <span className="tag tag-accent">公開中</span>
              <p className="mono">adhd.gawarago.com</p>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  className="btn btn-secondary"
                  href="https://adhd.gawarago.com"
                >
                  開く
                </a>
                <button
                  className="btn btn-ghost"
                  onClick={app.rollbackProd}
                  type="button"
                >
                  前の版に戻す
                </button>
              </div>
              <p className="kicker">本番の履歴</p>
              {app.state.prodHistory.map((item) => (
                <span key={`${item.label}-${item.when}`}>
                  {item.label} · {item.when}
                </span>
              ))}
            </article>
          </section>
        </div>
      </section>
      <OverlapDialog
        onClose={() => app.setOverlap(false)}
        onPick={(mode) => app.resolveOverlap(activeDraft?.id ?? "", mode)}
        overlap={app.state.overlap}
      />
      {promoteOpen ? (
        <div className="dialog-back">
          <div className="dialog dialog-wide">
            <span className="kicker">検証 v{app.state.staging} → 本番</span>
            <h2 className="dialog-title">本番へ反映しますか？</h2>
            <p className="lede">
              adhd.gawarago.com が v{app.state.staging}{" "}
              になります。反映は約20秒。うまくいかなければ「前の版に戻す」で v
              {app.state.prod} にすぐ戻せます。
            </p>
            <div
              className="card"
              style={{ background: "var(--color-accent-100)" }}
            >
              <strong>データについて</strong>
              <span>
                本番のデータはそのまま。新しい列は自動で追加されます。
              </span>
            </div>
            <div className="dialog-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setPromoteOpen(false)}
                type="button"
              >
                やめる
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setPromoteOpen(false);
                  app.failPromote();
                }}
                type="button"
              >
                反映（失敗を試す）
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setPromoteOpen(false);
                  app.promote(activeDraft?.id ?? "mobile", "live");
                  app.appendMessage(projectId, {
                    body: "本番に反映しました",
                    kind: "published",
                  });
                }}
                type="button"
              >
                本番へ反映
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Toast />
    </main>
  );
};
