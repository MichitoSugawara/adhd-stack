"use client";

import { useState } from "react";

import { SOURCE_TREE, sourceLinesOf } from "../lib/mock-seed";
import type { HistoryPoint, Preview, SideMessage } from "../lib/mock-types";
import { historyDot, paneSub, paneTitle } from "../lib/preview-ui";
import type { RightTab } from "../lib/right-tab";

interface EditorRightPaneProperties {
  busy: boolean;
  dirty: boolean;
  history: HistoryPoint[];
  onAskFile: (path: string) => void;
  onClose: () => void;
  onConsult: (text: string) => void;
  onRevert: (id: string) => void;
  onSendLeft: (text: string) => void;
  preview: Preview | undefined;
  sideMessages: SideMessage[];
  tab: RightTab;
}

const TASKS = [
  { done: false, title: "買い物リストを送る" },
  { done: false, title: "請求書を確認" },
  { done: false, title: "ADHD Stack のUIを直す" },
  { done: true, title: "朝の薬" },
  { done: true, title: "ゴミ出し" },
];

export const EditorRightPane = ({
  busy,
  dirty,
  history,
  onAskFile,
  onClose,
  onConsult,
  onRevert,
  onSendLeft,
  preview,
  sideMessages,
  tab,
}: EditorRightPaneProperties) => {
  const [device, setDevice] = useState<"desk" | "phone">("phone");
  const [address, setAddress] = useState(preview?.url ?? "");
  const [file, setFile] = useState("app/tasks/page.tsx");
  const [consult, setConsult] = useState("");
  const lines = sourceLinesOf(file);
  const title = paneTitle(tab);
  const sub = paneSub(tab);

  return (
    <aside className="editor-pane">
      <div className="pane-head">
        <span>{title}</span>
        <span style={{ alignItems: "center", display: "flex", gap: 8 }}>
          <span>{sub}</span>
          <button
            className="btn btn-icon btn-ghost"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </span>
      </div>
      {tab === "browser" ? (
        <div className="browser">
          <div className="browser-bar">
            <div className="card">
              <span
                style={{
                  color: busy ? "var(--color-accent-2)" : "var(--color-accent)",
                  fontSize: 10,
                }}
              >
                ●
              </span>
              <input
                onChange={(event) => setAddress(event.target.value)}
                value={address || preview?.url || ""}
              />
              <span style={{ color: "var(--color-neutral-600)", fontSize: 11 }}>
                {busy ? "反映中…" : "最新"}
              </span>
            </div>
            <div className="seg">
              <button
                className={`seg-opt ${device === "phone" ? "is-on" : ""}`}
                onClick={() => setDevice("phone")}
                type="button"
              >
                スマホ
              </button>
              <button
                className={`seg-opt ${device === "desk" ? "is-on" : ""}`}
                onClick={() => setDevice("desk")}
                type="button"
              >
                PC
              </button>
            </div>
          </div>
          <div className="phone-stage">
            <div
              className={`phone${device === "desk" ? " is-desk" : ""}${busy ? " is-busy" : ""}`}
            >
              <span style={{ fontSize: 22, fontWeight: 600 }}>
                今日やること
              </span>
              {TASKS.map((task) =>
                task.done ? null : (
                  <div className="card task" key={task.title}>
                    <i />
                    {task.title}
                  </div>
                )
              )}
              <span
                style={{
                  color: "var(--color-neutral-600)",
                  fontSize: 16,
                  fontWeight: 600,
                  marginTop: 8,
                }}
              >
                完了 · 2
              </span>
              {TASKS.map((task) =>
                task.done ? (
                  <div className="card task is-done" key={task.title}>
                    <i />
                    {task.title}
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>
      ) : null}
      {tab === "source" ? (
        <div className="source">
          <div className="source-tree">
            {SOURCE_TREE.map((item) => (
              <button
                className={`side-link${file === item.path ? " is-on" : ""}`}
                key={item.path}
                onClick={() => {
                  if (item.kind === "file") {
                    setFile(item.path);
                  }
                }}
                style={{ marginLeft: item.depth ? 8 : 0 }}
                type="button"
              >
                {item.label}
                {dirty && item.path === "app/tasks/page.tsx" ? (
                  <span className="tag tag-accent">変更</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="source-code">
            <div
              style={{
                color: "var(--color-neutral-600)",
                display: "flex",
                fontFamily: "var(--font-serif)",
                fontSize: 12,
                justifyContent: "space-between",
                padding: "0 20px 10px",
              }}
            >
              <span>{file}</span>
              <button
                className="btn btn-ghost"
                onClick={() => onAskFile(file)}
                type="button"
              >
                このファイルについて聞く
              </button>
            </div>
            {lines.map((code, index) => (
              <div
                className={`source-line${dirty && index > 7 ? " is-hi" : ""}`}
                key={`${file}-${code}-${index}`}
              >
                <em>{index + 1}</em>
                <span>{code}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {tab === "changes" ? (
        <div className="change" style={{ padding: "0 24px 24px" }}>
          {dirty ? (
            <pre className="source-code" style={{ margin: 0, padding: 16 }}>
              <div className="diff-add">
                + const open = tasks.filter((t) =&gt; !t.done);
              </div>
              <div className="diff-del">- &lt;h1&gt;タスク&lt;/h1&gt;</div>
              <div className="diff-add">
                + &lt;h1&gt;今日やること&lt;/h1&gt;
              </div>
            </pre>
          ) : (
            <p className="lede">変更はありません。</p>
          )}
        </div>
      ) : null}
      {tab === "history" ? (
        <ol className="history">
          {history.map((point) => (
            <li className={point.current ? "is-now" : undefined} key={point.id}>
              <span
                className="side-dot"
                style={{
                  background: historyDot(point.where),
                  marginTop: 8,
                }}
              />
              <div>
                <strong>{point.title}</strong>
                <div className="lede">
                  {point.when} · {point.meta}
                </div>
                {point.current ? null : (
                  <button
                    className="btn btn-ghost"
                    onClick={() => onRevert(point.id)}
                    type="button"
                  >
                    この時点に戻す
                  </button>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {tab === "consult" ? (
        <div
          className="consult"
          style={{ display: "grid", gap: 12, padding: "0 24px 24px" }}
        >
          <div
            className="card"
            style={{ background: "var(--color-accent-100)" }}
          >
            ここは相談用です。コードは変えません。
          </div>
          {sideMessages.map((item) => (
            <div key={item.id}>
              <p className={item.kind === "user" ? "msg-user" : "msg-ai"}>
                {item.body}
              </p>
              {item.action ? (
                <button
                  className="btn btn-ghost"
                  onClick={() => onSendLeft(item.action ?? "")}
                  type="button"
                >
                  ← 左に送る
                </button>
              ) : null}
            </div>
          ))}
          <input
            className="input"
            onChange={(event) => setConsult(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onConsult(consult);
                setConsult("");
              }
            }}
            placeholder="コードを変えずに聞く"
            value={consult}
          />
        </div>
      ) : null}
    </aside>
  );
};
