"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import type { Preview } from "../lib/mock-types";
import { previewTagClass, usageBarColor } from "../lib/preview-ui";
import { applyTheme, readChoice, subscribeTheme } from "../lib/theme";
import type { ThemeChoice } from "../lib/theme";

interface EditorLeftRailProperties {
  onNewPreview: () => void;
  previewId: string | undefined;
  previews: Preview[];
  prod: number;
  projectId: string;
  projectName: string;
  staging: number;
  usage: number;
}

const choiceSnapshot = (): ThemeChoice => readChoice();
const choiceServer = (): ThemeChoice => "auto";

export const EditorLeftRail = ({
  onNewPreview,
  previewId,
  previews,
  prod,
  projectId,
  projectName,
  staging,
  usage,
}: EditorLeftRailProperties) => {
  const choice = useSyncExternalStore(
    subscribeTheme,
    choiceSnapshot,
    choiceServer
  );
  const drafts: Preview[] = [];
  for (const item of previews) {
    if (item.kind === "draft") {
      drafts.push(item);
    }
  }
  const usageColor = usageBarColor(usage);

  return (
    <aside className="editor-side">
      <Link
        className="nav-brand"
        href="/projects"
        style={{ margin: "0 8px 12px" }}
      >
        ADHD Stack
      </Link>
      <button className="side-link" type="button">
        {projectName} ▾
      </button>
      <p className="kicker" style={{ padding: "12px 10px 4px" }}>
        環境
      </p>
      <div className="side-link">
        <span
          className="side-dot"
          style={{ background: "var(--color-text)" }}
        />
        本番 v{prod}
      </div>
      <div className="side-link">
        <span
          className="side-dot"
          style={{ background: "var(--color-neutral-500)" }}
        />
        検証 v{staging}
      </div>
      <p className="kicker" style={{ padding: "12px 10px 4px" }}>
        プレビュー · {drafts.length}
      </p>
      {drafts.map((item) => {
        const on = previewId === item.id;
        const wait = item.state === "要確認";
        const work = item.state === "作業中";
        const old = item.state === "3日前";
        return (
          <Link
            className={`side-link${on ? " is-on" : ""}${wait && on ? " is-wait" : ""}`}
            href={`/p/${projectId}?preview=${item.id}`}
            key={item.id}
          >
            <span
              className={`side-dot${wait ? " is-wait" : ""}${old ? " is-old" : ""}${work ? " is-work" : ""}`}
            />
            <span style={{ flex: 1 }}>{item.title}</span>
            <span className={previewTagClass(item.state)}>{item.state}</span>
          </Link>
        );
      })}
      <button
        className="btn btn-ghost"
        onClick={onNewPreview}
        style={{ justifyContent: "flex-start", marginTop: 6 }}
        type="button"
      >
        ＋ 新しいプレビュー
      </button>
      <div className="rail-foot">
        <span style={{ display: "flex", justifyContent: "space-between" }}>
          <span>今日の AI 利用</span>
          <span style={{ color: usageColor }}>{usage}%</span>
        </span>
        <div className="bar" aria-hidden="true">
          <i style={{ background: usageColor, width: `${usage}%` }} />
        </div>
        <div className="seg" style={{ alignSelf: "start", marginTop: 8 }}>
          <button
            className={`seg-opt ${choice === "light" ? "is-on" : ""}`}
            onClick={() => applyTheme("light")}
            type="button"
          >
            明
          </button>
          <button
            className={`seg-opt ${choice === "dark" ? "is-on" : ""}`}
            onClick={() => applyTheme("dark")}
            type="button"
          >
            暗
          </button>
          <button
            className={`seg-opt ${choice === "auto" ? "is-on" : ""}`}
            onClick={() => applyTheme("auto")}
            type="button"
          >
            自動
          </button>
        </div>
        <Link href="/projects">← プロジェクト一覧</Link>
        <Link href="/connect">接続を管理</Link>
      </div>
    </aside>
  );
};
