"use client";

import { useEffect, useRef, useState } from "react";

import { useCapturePreview, usePreviewRender } from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";

export const KITESURF_CAPTURING_MESSAGE = "Kitesurf で表示を読み込んでいます…";

export type KitesurfPreviewStatus =
  | "error"
  | "needs_setup"
  | "pending"
  | "ready"
  | null;

export interface KitesurfPreviewState {
  busy: boolean;
  imageUrl: string | null;
  message: string | null;
  status: KitesurfPreviewStatus;
}

export const useKitesurfPreview = (
  slug: string | undefined,
  url: string | null,
  viewport: "desktop" | "mobile",
  revision: number
) => {
  const render = usePreviewRender(slug ?? "", url, viewport);
  const capture = useCapturePreview();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const startedFor = useRef<string>("");

  useEffect(() => {
    if (!slug || !url) {
      return;
    }
    if (render === undefined) {
      return;
    }
    const key = `${slug}|${url}|${viewport}|${String(revision)}`;
    if (startedFor.current === key) {
      return;
    }
    if (revision === 0 && render?.status === "ready" && render.imageUrl) {
      startedFor.current = key;
      return;
    }
    if (
      revision === 0 &&
      (render?.status === "needs_setup" || render?.status === "error")
    ) {
      startedFor.current = key;
      return;
    }
    startedFor.current = key;
    const run = async () => {
      setBusy(true);
      setActionError(null);
      try {
        const result = await capture({
          force: revision > 0,
          slug,
          targetUrl: url,
          viewport,
        });
        if (result.status !== "ready") {
          setActionError(result.message);
        }
      } catch (error) {
        setActionError(connectErrorMessage(error));
      } finally {
        setBusy(false);
      }
    };
    void run();
  }, [capture, render, revision, slug, url, viewport]);

  let status: KitesurfPreviewStatus = null;
  if (render) {
    const { status: renderStatus } = render;
    if (renderStatus) {
      status = renderStatus;
    }
  } else if (url) {
    status = "pending";
  }
  return {
    busy,
    imageUrl: render?.imageUrl ?? null,
    message: actionError ?? render?.message ?? null,
    status,
  } satisfies KitesurfPreviewState;
};
