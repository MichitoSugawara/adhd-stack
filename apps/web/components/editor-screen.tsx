"use client";

import {
  BrowserIcon,
  SidebarIcon,
  TerminalWindowIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import type { Message } from "../lib/mock-types";
import { rightTabFrom } from "../lib/right-tab";
import { EditorComposer } from "./editor-composer";
import { EditorHand } from "./editor-hand";
import type { HandTab } from "./editor-hand";
import { EditorLeftRail } from "./editor-left-rail";
import { EditorRightPane } from "./editor-right-pane";
import { MessageView } from "./message-view";
import { NeedSession } from "./need-session";
import { OverlapDialog } from "./overlap-dialog";
import { StackChrome } from "./stack-chrome";

interface EditorScreenProperties {
  projectId: string;
}

const collectFiles = (thread: Message[]): string[] => {
  const seen = new Set<string>();
  const files: string[] = [];
  for (const message of thread) {
    for (const file of message.meta?.files ?? []) {
      if (seen.has(file.file)) {
        continue;
      }
      seen.add(file.file);
      files.push(file.file);
    }
  }
  return files;
};

export const EditorScreen = ({ projectId }: EditorScreenProperties) => {
  const app = useMockApp();
  const router = useRouter();
  const search = useSearchParams();
  const project = app.state.projects.find((item) => item.id === projectId);
  const [draft, setDraft] = useState("");
  const [side, setSide] = useState(true);
  const [right, setRight] = useState(true);
  const [term, setTerm] = useState(true);
  const [hand, setHand] = useState<HandTab>("chat");
  const [tab, setTab] = useState(() => rightTabFrom(search.get("tab")));
  const previewId = search.get("preview");
  const projectPreviews: typeof app.state.previews = [];
  let preview = app.state.previews.find((item) => item.id === previewId);
  for (const item of app.state.previews) {
    if (item.projectId === projectId) {
      projectPreviews.push(item);
      if (!preview) {
        preview = item;
      }
    }
  }
  const thread = app.state.messages[projectId] ?? [];
  const files = collectFiles(thread);
  const change = thread.find((message) => message.kind === "changes");

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

  const onTab = (next: ReturnType<typeof rightTabFrom>) => {
    setTab(next);
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
    void app.sendTalk(projectId, text);
  };

  const goEnvs = () => {
    router.push(`/p/${projectId}/envs`);
  };

  const approve = () => {
    const draftPreview = projectPreviews.find((item) => item.kind === "draft");
    if (draftPreview) {
      app.promote(draftPreview.id, "review");
    }
    goEnvs();
  };

  const pick = (option: string) => {
    void app.sendTalk(projectId, option);
  };

  const composer = (
    <EditorComposer draft={draft} onDraft={setDraft} onSend={send} />
  );

  const editorClass = [
    "editor",
    side ? "" : "is-side-off",
    right ? "" : "is-right-off",
    term ? "" : "is-term-off",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main className={`stack ${fontVariables}`}>
      <div className="desk">
        <div className={editorClass}>
          <div className="editor-top">
            <StackChrome />
            <div className="topbar">
              <strong>{project.name}</strong>
              <div className="topbar-actions">
                <button
                  aria-label="左を開閉"
                  className="btn btn-ghost"
                  onClick={() => setSide((value) => !value)}
                  type="button"
                >
                  <SidebarIcon size={16} weight="duotone" />
                </button>
                <button
                  aria-label="右を開閉"
                  className="btn btn-ghost"
                  onClick={() => setRight((value) => !value)}
                  type="button"
                >
                  <BrowserIcon size={16} weight="duotone" />
                </button>
                <button
                  aria-label="下を開閉"
                  className="btn btn-ghost"
                  onClick={() => setTerm((value) => !value)}
                  type="button"
                >
                  <TerminalWindowIcon size={16} weight="duotone" />
                </button>
                <Link className="btn btn-ghost" href={`/p/${projectId}/envs`}>
                  環境
                </Link>
              </div>
            </div>
          </div>
          {side ? (
            <EditorLeftRail
              previewId={preview?.id}
              previews={projectPreviews}
              projectId={projectId}
            />
          ) : (
            <div />
          )}
          <section className="editor-chat">
            <div className="thread">
              {thread.map((message) => (
                <MessageView
                  key={message.id}
                  message={message}
                  onApprove={approve}
                  onOverlap={() => app.setOverlap(true)}
                  onPick={pick}
                  onSecret={goEnvs}
                />
              ))}
            </div>
            {composer}
          </section>
          {right ? (
            <EditorRightPane
              changeBody={change?.body ?? "変更はまだありません"}
              files={files}
              history={app.state.history}
              onTab={onTab}
              preview={preview}
              project={project}
              tab={tab}
            />
          ) : (
            <div />
          )}
          {term ? (
            <pre className="editor-term term">
              {app.state.terminal.map((line) => (
                <span className={line.tone} key={line.text}>
                  {line.text}
                  {"\n"}
                </span>
              ))}
            </pre>
          ) : (
            <div />
          )}
        </div>
      </div>
      <EditorHand
        composer={composer}
        onApprove={approve}
        onHand={setHand}
        onOverlap={() => app.setOverlap(true)}
        onPick={pick}
        onSecret={goEnvs}
        preview={preview}
        project={project}
        tab={hand}
        thread={thread}
      />
      <OverlapDialog
        onClose={() => app.setOverlap(false)}
        overlap={app.state.overlap}
      />
    </main>
  );
};
