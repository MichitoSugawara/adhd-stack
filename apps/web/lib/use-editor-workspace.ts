"use client";

import { useEffect, useRef, useState } from "react";

import type { EditorRail } from "./editor-copy";
import { filterThread, isEditorReady, provisionHeadline } from "./editor-copy";
import { MOCK_DIFF_HUNKS, MOCK_FILES, MOCK_REPO } from "./mock-copy";
import {
  allConnectedOf,
  appendMessage,
  readyWorkspace,
  useMockApp,
} from "./mock-store";

const wait = async (ms: number) =>
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

export const useEditorWorkspace = () => {
  const { hydrated, state, write } = useMockApp();
  const [draft, setDraft] = useState("");
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rail, setRail] = useState<EditorRail>("chat");
  const provisionStarted = useRef(false);

  const board = {
    allConnected: allConnectedOf(state.connections),
  };
  const { workspace } = state;
  const ready = isEditorReady(workspace);
  const thread = state.messages;
  const hasDiffs = thread.some((message) => message.kind === "diff");
  const hasCommands = thread.some((message) => message.kind === "command");
  const visibleThread = filterThread(thread, rail);
  const liveStatus =
    statusLine ??
    (state.publish.status === "published"
      ? `公開しました（モック） / Pages: ${state.publish.pagesUrl} / Convex: ${state.publish.convexUrl}`
      : null) ??
    (ready ? null : provisionHeadline(workspace));
  const composerDisabled = busy || !ready || draft.trim().length === 0;

  useEffect(() => {
    if (!(hydrated && board.allConnected)) {
      return;
    }
    if (ready || workspace?.provisionStatus === "provisioning") {
      return;
    }
    if (provisionStarted.current) {
      return;
    }
    provisionStarted.current = true;
    const run = async () => {
      write((prev) => ({
        ...prev,
        workspace: {
          ...readyWorkspace(),
          cloudflarePagesUrl: undefined,
          codexEnvironmentId: undefined,
          convexUrl: undefined,
          provisionStatus: "provisioning",
        },
      }));
      await wait(500);
      write((prev) => ({
        ...prev,
        workspace: {
          ...(prev.workspace ?? readyWorkspace()),
          githubRepoFullName: MOCK_REPO.fullName,
          githubRepoUrl: MOCK_REPO.url,
          provisionStatus: "provisioning",
        },
      }));
      await wait(500);
      write((prev) => ({
        ...prev,
        workspace: readyWorkspace(),
      }));
    };
    void run();
  }, [board.allConnected, hydrated, ready, workspace?.provisionStatus, write]);

  const retryProvision = () => {
    provisionStarted.current = false;
    setStatusLine("モック環境をもう一度用意しています");
    write((prev) => ({
      ...prev,
      workspace: {
        ...readyWorkspace(),
        cloudflarePagesUrl: undefined,
        codexEnvironmentId: undefined,
        convexUrl: undefined,
        provisionStatus: "provisioning",
      },
    }));
  };

  const playTask = async (text: string) => {
    write((prev) =>
      appendMessage(prev, { body: text, kind: "text", role: "user" })
    );
    await wait(380);
    write((prev) =>
      appendMessage(prev, {
        body: "方針を組み立てています。これはデモの思考ログです。",
        kind: "thinking",
        role: "assistant",
      })
    );
    await wait(520);
    write((prev) =>
      appendMessage(prev, {
        body: "モックの作業面でファイルを開いています。",
        kind: "work",
        role: "assistant",
      })
    );
    await wait(420);
    write((prev) =>
      appendMessage(prev, {
        body: "pnpm check",
        kind: "command",
        meta: { command: "pnpm check" },
        role: "assistant",
      })
    );
    await wait(480);
    write((prev) =>
      appendMessage(prev, {
        body: "デモ用の差分です。実リポジトリは書き換えていません。",
        kind: "diff",
        meta: {
          additions: 12,
          deletions: 3,
          files: [...MOCK_FILES],
          hunks: MOCK_DIFF_HUNKS,
        },
        role: "assistant",
      })
    );
    await wait(360);
    write((prev) =>
      appendMessage(prev, {
        body: "完了（デモ）。モックの差分まで進めました。",
        kind: "text",
        role: "assistant",
      })
    );
    setRail("chat");
  };

  const send = async () => {
    if (draft.trim().length === 0 || !ready) {
      return;
    }
    const text = draft.trim();
    setDraft("");
    setBusy(true);
    try {
      await playTask(text);
    } finally {
      setBusy(false);
    }
  };

  const applyChip = (text: string) => {
    setDraft(text);
  };

  const publish = async () => {
    setPublishing(true);
    setStatusLine("モック公開を進めています");
    write((prev) => ({
      ...prev,
      publish: { status: "publishing" },
    }));
    await wait(720);
    write((prev) => ({
      ...prev,
      publish: {
        at: Date.now(),
        convexUrl: prev.workspace?.convexUrl,
        pagesUrl: prev.workspace?.cloudflarePagesUrl,
        status: "published",
      },
    }));
    setStatusLine(
      `公開しました（モック） / Pages: ${MOCK_REPO.pagesUrl} / Convex: https://${MOCK_REPO.project}.convex.cloud`
    );
    setPublishing(false);
  };

  return {
    applyChip,
    board: hydrated ? board : undefined,
    busy,
    composerDisabled,
    draft,
    hasCommands,
    hasDiffs,
    liveStatus,
    publish,
    publishState: state.publish,
    publishing,
    rail,
    ready,
    retryProvision,
    send,
    setDraft,
    setRail,
    visibleThread,
    workspace,
  };
};
