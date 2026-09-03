"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import type { EditorRail } from "./editor-copy";
import { filterThread, isEditorReady, provisionHeadline } from "./editor-copy";

export const useEditorWorkspace = () => {
  const board = useQuery(api.connections.getBoard);
  const workspace = useQuery(api.workspaces.getMine);
  const ensure = useMutation(api.workspaces.ensure);
  const provision = useAction(api.workspaceProvision.provision);
  const publishWorkspace = useAction(api.workspacePublish.publish);
  const sendMessage = useMutation(api.chat.send);
  const messages = useQuery(
    api.chat.list,
    workspace
      ? {
          paginationOpts: { cursor: null, numItems: 80 },
          workspaceId: workspace._id,
        }
      : "skip"
  );
  const [draft, setDraft] = useState("");
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rail, setRail] = useState<EditorRail>("chat");

  const ready = isEditorReady(workspace);
  const thread: Doc<"messages">[] = messages?.page ?? [];
  const hasDiffs = thread.some((message) => message.kind === "diff");
  const hasCommands = thread.some((message) => message.kind === "command");
  const visibleThread = filterThread(thread, rail);
  const provisionError =
    workspace?.provisionError && workspace.provisionError.length > 0
      ? workspace.provisionError
      : null;
  const liveStatus =
    statusLine ??
    provisionError ??
    (ready ? null : provisionHeadline(workspace));
  const composerDisabled = busy || !ready || draft.trim().length === 0;

  useEffect(() => {
    if (!board?.allConnected) {
      return;
    }
    if (workspace === undefined) {
      return;
    }
    if (ready) {
      return;
    }
    if (workspace?.provisionStatus === "provisioning") {
      return;
    }
    if (workspace?.provisionStatus === "error") {
      return;
    }
    void (async () => {
      await ensure({});
      await provision({});
    })();
  }, [board?.allConnected, ensure, provision, ready, workspace]);

  const retryProvision = async () => {
    setStatusLine("もう一度用意しています");
    await ensure({});
    await provision({});
  };

  const send = async () => {
    if (!workspace || draft.trim().length === 0 || !ready) {
      return;
    }
    setBusy(true);
    try {
      await sendMessage({ text: draft, workspaceId: workspace._id });
      setDraft("");
      setRail("chat");
    } catch (error) {
      setStatusLine(
        error instanceof Error ? error.message : "送れませんでした"
      );
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    try {
      const result = await publishWorkspace({});
      const parts = [
        result.cloudflarePagesUrl
          ? `Pages: ${result.cloudflarePagesUrl}`
          : "Pages 失敗",
        result.convexUrl ? `Convex: ${result.convexUrl}` : "Convex 失敗",
      ];
      if (result.error) {
        parts.push(result.error);
      }
      setStatusLine(parts.join(" / "));
    } catch (error) {
      setStatusLine(
        error instanceof Error ? error.message : "公開に失敗しました"
      );
    } finally {
      setPublishing(false);
    }
  };

  return {
    board,
    busy,
    composerDisabled,
    draft,
    hasCommands,
    hasDiffs,
    liveStatus,
    publish,
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
