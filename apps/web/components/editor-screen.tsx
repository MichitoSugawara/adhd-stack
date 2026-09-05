"use client";

import { SidebarSimpleIcon, TerminalWindowIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import { composerPlaceholder, previewTagClass } from "../lib/preview-ui";
import { rightTabFrom } from "../lib/right-tab";
import type { RightTab } from "../lib/right-tab";
import { EditorComposer } from "./editor-composer";
import { EditorHand } from "./editor-hand";
import type { HandTab } from "./editor-hand";
import { EditorLeftRail } from "./editor-left-rail";
import { EditorRightPane } from "./editor-right-pane";
import { MessageView } from "./message-view";
import { NeedSession } from "./need-session";
import { OverlapDialog } from "./overlap-dialog";
import { StackChrome } from "./stack-chrome";
import { Toast } from "./toast";

interface EditorScreenProperties {
  projectId: string;
}

export const EditorScreen = ({ projectId }: EditorScreenProperties) => {
  const app = useMockApp();
  const router = useRouter();
  const search = useSearchParams();
  const project = app.state.projects.find((item) => item.id === projectId);
  const [draft, setDraft] = useState("");
  const [right, setRight] = useState(true);
  const [term, setTerm] = useState(false);
  const [termDraft, setTermDraft] = useState("");
  const [hand, setHand] = useState<HandTab>("chat");
  const [tab, setTab] = useState(() => rightTabFrom(search.get("tab")));
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewName, setPreviewName] = useState("決済フロー");
  const [promoteOpen, setPromoteOpen] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const previewId = search.get("preview");
  const projectPreviews: typeof app.state.previews = [];
  let preview = app.state.previews.find((item) => item.id === previewId);
  for (const item of app.state.previews) {
    if (item.projectId === projectId) {
      projectPreviews.push(item);
      if (!preview && item.kind === "draft") {
        preview = item;
      }
    }
  }
  const thread = app.state.messages[projectId] ?? [];
  const changeCount = app.state.dirty ? 2 : 0;

  useEffect(() => {
    const node = chatRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [thread.length]);

  const askRef = useRef(app.askQuestion);
  askRef.current = app.askQuestion;
  useEffect(() => {
    if (preview?.state === "要確認") {
      askRef.current(projectId, preview.id);
    }
  }, [preview?.id, preview?.state, projectId]);

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

  const onTab = (next: RightTab) => {
    setTab(next);
    setRight(true);
    const params = new URLSearchParams(search.toString());
    params.set("tab", next);
    if (preview) {
      params.set("preview", preview.id);
    }
    window.history.replaceState(
      null,
      "",
      `/p/${projectId}?${params.toString()}`
    );
  };

  const send = () => {
    const text = draft.trim();
    if (text.length === 0) {
      return;
    }
    setDraft("");
    void app.sendTalk(projectId, text, preview?.id);
  };

  const composer = (
    <EditorComposer
      busy={app.state.busy}
      draft={draft}
      onDraft={setDraft}
      onSend={send}
      onStop={() => app.stopTalk(projectId)}
      placeholder={composerPlaceholder(
        app.state.busy,
        preview?.state === "要確認"
      )}
    />
  );

  const editorClass = [
    "editor",
    right ? "" : "is-right-off",
    term ? "is-term-on" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={`stack ${fontVariables}`}>
      <div className="desk">
        <div className={editorClass}>
          <EditorLeftRail
            onNewPreview={() => setPreviewOpen(true)}
            previewId={preview?.id}
            previews={projectPreviews}
            prod={app.state.prod}
            projectId={projectId}
            projectName={project.name}
            staging={app.state.staging}
            usage={app.state.usage}
          />
          <div className="editor-head">
            <span className="editor-crumb">
              <span>{project.name}</span>
              <span style={{ color: "var(--color-neutral-500)" }}>／</span>
              <b>{preview?.title ?? "プレビュー"}</b>
              {preview ? (
                <span className={previewTagClass(preview.state)}>
                  {preview.state}
                </span>
              ) : null}
            </span>
            <span style={{ alignItems: "center", display: "flex", gap: 6 }}>
              <div className="seg">
                {(
                  [
                    ["browser", `ブラウザ`],
                    ["source", "ソース"],
                    ["changes", `変更 ${changeCount}`],
                    ["history", "履歴"],
                    ["consult", "相談"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    className={`seg-opt ${tab === id ? "is-on" : ""}`}
                    key={id}
                    onClick={() => onTab(id)}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                aria-label="ターミナル"
                className="btn btn-icon btn-ghost"
                onClick={() => setTerm((value) => !value)}
                style={{
                  background: term ? "var(--color-accent-100)" : undefined,
                }}
                type="button"
              >
                <TerminalWindowIcon size={18} weight="duotone" />
              </button>
              <button
                aria-label="右パネル"
                className="btn btn-icon btn-ghost"
                onClick={() => setRight((value) => !value)}
                style={{
                  background: right ? "var(--color-accent-100)" : undefined,
                }}
                type="button"
              >
                <SidebarSimpleIcon size={18} weight="duotone" />
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setSaveOpen(true)}
                type="button"
              >
                保存ポイントに名前
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  if (
                    !(app.state.dirty || (preview?.savepoints.length ?? 0) > 0)
                  ) {
                    app.toast("送るものがありません");
                    return;
                  }
                  setPromoteOpen(true);
                }}
                style={{ opacity: app.state.dirty ? 1 : 0.45 }}
                type="button"
              >
                検証へ送る
              </button>
            </span>
          </div>
          <section className="editor-chat">
            <div className="thread-head">
              <span>チャット</span>
              <span>{preview?.title ?? project.name} と話しています</span>
            </div>
            <div className="thread" ref={chatRef}>
              {thread.map((message) => (
                <MessageView
                  key={message.id}
                  message={message}
                  onApprove={(ok) => app.resolveApproval(projectId, ok)}
                  onChanges={() => onTab("changes")}
                  onLimit={(reset) => app.resolveLimit(projectId, reset)}
                  onPick={(option) =>
                    app.answerQuestion(projectId, preview?.id ?? "", option)
                  }
                  onSecret={(ok) => app.resolveSecret(projectId, ok)}
                  previewName={preview?.title ?? project.name}
                />
              ))}
            </div>
            {composer}
          </section>
          {right ? (
            <EditorRightPane
              busy={app.state.busy}
              dirty={app.state.dirty}
              history={app.state.history}
              onAskFile={(path) =>
                setDraft(`${path} は何をしている？わかりやすく説明して`)
              }
              onClose={() => setRight(false)}
              onConsult={app.askSide}
              onRevert={app.revertHistory}
              onSendLeft={(text) => setDraft(text)}
              preview={preview}
              sideMessages={app.state.sideMessages}
              tab={tab}
            />
          ) : (
            <div />
          )}
          {term ? (
            <div className="editor-term">
              <div className="term-head">
                <span>
                  Cloudflare Sandbox · {preview?.title ?? project.name} ·
                  /workspace/{project.name}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    app.write((prev) => ({ ...prev, terminal: [] }))
                  }
                  type="button"
                >
                  消す
                </button>
              </div>
              <pre className="term">
                {app.state.terminal.map((line) => (
                  <span className={line.tone} key={`${line.text}-${line.tone}`}>
                    {line.text}
                    {"\n"}
                  </span>
                ))}
              </pre>
              <form
                className="term-input"
                onSubmit={(event) => {
                  event.preventDefault();
                  app.runTerm(termDraft);
                  setTermDraft("");
                }}
              >
                <input
                  onChange={(event) => setTermDraft(event.target.value)}
                  placeholder="$ コマンド"
                  value={termDraft}
                />
              </form>
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>
      <EditorHand
        composer={composer}
        onApprove={(ok) => app.resolveApproval(projectId, ok)}
        onChanges={() => onTab("changes")}
        onHand={setHand}
        onLimit={(reset) => app.resolveLimit(projectId, reset)}
        onPick={(option) =>
          app.answerQuestion(projectId, preview?.id ?? "", option)
        }
        onSecret={(ok) => app.resolveSecret(projectId, ok)}
        preview={preview}
        project={project}
        tab={hand}
        thread={thread}
      />
      <OverlapDialog
        onClose={() => app.setOverlap(false)}
        onPick={(mode) => app.resolveOverlap(preview?.id ?? "", mode)}
        overlap={app.state.overlap}
      />
      {saveOpen ? (
        <div className="dialog-back">
          <form
            className="dialog"
            onSubmit={(event) => {
              event.preventDefault();
              app.nameSavepoint(saveName || "名前なし");
              setSaveOpen(false);
              setSaveName("");
            }}
          >
            <h2 className="dialog-title">保存ポイントに名前を付ける</h2>
            <p className="lede">
              保存は AI
              の各ターン後に自動でされています。名前は履歴で見つけやすくするためだけのものです。
            </p>
            <input
              className="input"
              onChange={(event) => setSaveName(event.target.value)}
              placeholder="例: 完了を下に寄せた"
              value={saveName}
            />
            <div className="dialog-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setSaveOpen(false)}
                type="button"
              >
                やめる
              </button>
              <button className="btn btn-primary" type="submit">
                付ける
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {previewOpen ? (
        <div className="dialog-back">
          <form
            className="dialog"
            onSubmit={(event) => {
              event.preventDefault();
              const id = app.createPreview(
                projectId,
                previewName || "新しいプレビュー"
              );
              setPreviewOpen(false);
              router.push(`/p/${projectId}?preview=${id}`);
            }}
          >
            <h2 className="dialog-title">新しいプレビュー</h2>
            <input
              className="input"
              onChange={(event) => setPreviewName(event.target.value)}
              value={previewName}
            />
            <p className="mono">
              {previewName
                .toLowerCase()
                .replaceAll(/[^a-z0-9]+/gu, "-")
                .replaceAll(/^-|-$/gu, "")}
              .preview.adhd.gawarago.com
            </p>
            <div className="dialog-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setPreviewOpen(false)}
                type="button"
              >
                やめる
              </button>
              <button className="btn btn-primary" type="submit">
                作って開く
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {promoteOpen ? (
        <div className="dialog-back">
          <div className="dialog">
            <span className="kicker">{preview?.title} → 検証</span>
            <h2 className="dialog-title">検証へ送りますか？</h2>
            <p className="lede">
              staging.adhd.gawarago.com
              が新しい版になります。本番には影響しません。
            </p>
            <div className="dialog-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setPromoteOpen(false)}
                type="button"
              >
                やめる
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setPromoteOpen(false);
                  if (preview) {
                    app.promote(preview.id, "review");
                  }
                  router.push(`/p/${projectId}/envs`);
                }}
                type="button"
              >
                検証へ送る
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Toast />
    </main>
  );
};
