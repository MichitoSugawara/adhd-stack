"use client";

import { useEffect, useState } from "react";

import { usePublishApp, useRefreshPages } from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";
import type { PagesDeployStatus } from "@/lib/publish-copy";
import { hasPagesDeployStarted, isPagesBuildPending } from "@/lib/publish-copy";

interface WorkspacePublishFields {
  pagesDeployStatus?: PagesDeployStatus;
  publishError?: string;
  publishNotes?: string[];
}

export const usePublishFlow = (
  slug: string,
  workspace: WorkspacePublishFields | null | undefined
) => {
  const publishApp = usePublishApp();
  const refreshPages = useRefreshPages();
  const [publishing, setPublishing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<string[]>([]);
  const [localStatus, setLocalStatus] = useState<PagesDeployStatus | null>(
    null
  );

  const notes = workspace?.publishNotes ?? localNotes;
  const status = workspace?.pagesDeployStatus ?? localStatus;
  const publishError = localError ?? (workspace?.publishError || null);
  const waiting = isPagesBuildPending(publishing, status, notes);

  useEffect(() => {
    if (
      !waiting ||
      publishing ||
      status === "success" ||
      status === "failure"
    ) {
      return;
    }
    if (!(status === "started" || hasPagesDeployStarted(notes))) {
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const next = await refreshPages({ slug });
        if (cancelled) {
          return;
        }
        if (next.notes.length > 0) {
          setLocalNotes(next.notes);
        }
        setLocalStatus(next.pagesDeployStatus);
        if (next.error) {
          setLocalError(next.error);
        }
      } catch {
        // Keep waiting. A failed poll is not a finished build.
      }
    };
    const timer = window.setInterval(() => {
      void tick();
    }, 8000);
    void tick();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [notes, publishing, refreshPages, slug, status, waiting]);

  const publish = async () => {
    if (publishing) {
      return;
    }
    setPublishing(true);
    setLocalError(null);
    try {
      const result = await publishApp({ slug });
      setLocalNotes(result.notes);
      setLocalError(result.error);
      setLocalStatus(
        result.pagesDeployStatus ??
          (hasPagesDeployStarted(result.notes) ? "started" : null)
      );
    } catch (error) {
      setLocalNotes([]);
      setLocalError(connectErrorMessage(error));
      setLocalStatus(null);
    } finally {
      setPublishing(false);
    }
  };

  return {
    error: publishError,
    notes,
    pagesDeployStatus: status,
    pending: publishing,
    publish,
    waiting,
  };
};
