"use node";

import { v } from "convex/values";
import type { Infer } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { internalAction } from "./_generated/server";
import { loadFreshConnection } from "./lib/actionAuth";
import {
  BROWSER_RUN_SETUP_MESSAGE,
  captureKitesurfScreenshot,
  isWorkspacePreviewTarget,
  pickBrowserRunCredentials,
  setupMessageFor,
} from "./lib/browserRun";
import { asStoredHttpUrl } from "./lib/publishResult";
import { previewRenderValidator, previewViewportValidator } from "./validators";

type PreviewRender = Infer<typeof previewRenderValidator>;

const emptyRender = (
  targetUrl: string,
  viewport: "desktop" | "mobile",
  status: "error" | "needs_setup",
  message: string
) => ({
  browser: "kitesurf" as const,
  capturedAt: null,
  imageUrl: null,
  message,
  status,
  targetUrl,
  viewport,
});

export const capturePreview = internalAction({
  args: {
    force: v.boolean(),
    targetUrl: v.string(),
    userId: v.id("users"),
    viewport: previewViewportValidator,
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<PreviewRender> => {
    const targetUrl = asStoredHttpUrl(args.targetUrl);
    if (!targetUrl) {
      return emptyRender(
        args.targetUrl,
        args.viewport,
        "error",
        "表示できる URL ではありません。"
      );
    }
    const workspace = await ctx.runQuery(
      internal.workspaceInternal.getWorkspace,
      { workspaceId: args.workspaceId }
    );
    if (!workspace) {
      return emptyRender(
        targetUrl,
        args.viewport,
        "error",
        "アプリが見つかりません。"
      );
    }
    if (!isWorkspacePreviewTarget(targetUrl, workspace)) {
      return emptyRender(
        targetUrl,
        args.viewport,
        "error",
        "この URL は、このアプリの公開先ではありません。"
      );
    }
    if (!args.force) {
      const existing: {
        imageStorageId?: Id<"_storage">;
        status: PreviewRender["status"];
      } | null = await ctx.runQuery(internal.workspacePreview.getRenderRow, {
        targetUrl,
        viewport: args.viewport,
        workspaceId: args.workspaceId,
      });
      if (existing?.status === "ready" && existing.imageStorageId) {
        const imageUrl: string | null = await ctx.runQuery(
          internal.workspacePreview.renderImageUrl,
          { storageId: existing.imageStorageId }
        );
        return {
          browser: "kitesurf" as const,
          capturedAt: null,
          imageUrl,
          message: "",
          status: "ready" as const,
          targetUrl,
          viewport: args.viewport,
        };
      }
    }
    const cloudflare = await loadFreshConnection(
      ctx,
      args.userId,
      "cloudflare"
    );
    const credentials = pickBrowserRunCredentials({
      platformAccountId: process.env.CLOUDFLARE_BROWSER_RUN_ACCOUNT_ID,
      platformToken: process.env.CLOUDFLARE_BROWSER_RUN_TOKEN,
      userAccountId: workspace.cloudflareAccountId ?? cloudflare?.accountId,
      userToken: cloudflare?.accessToken,
    });
    if (credentials.source === "missing") {
      await ctx.runMutation(internal.workspacePreview.saveRender, {
        error: BROWSER_RUN_SETUP_MESSAGE,
        status: "needs_setup",
        targetUrl,
        viewport: args.viewport,
        workspaceId: args.workspaceId,
      });
      return emptyRender(
        targetUrl,
        args.viewport,
        "needs_setup",
        BROWSER_RUN_SETUP_MESSAGE
      );
    }
    let shot = await captureKitesurfScreenshot({
      accountId: credentials.accountId,
      targetUrl,
      token: credentials.token,
      viewport: args.viewport,
    });
    if (
      shot.kind === "forbidden" &&
      credentials.source === "user" &&
      process.env.CLOUDFLARE_BROWSER_RUN_TOKEN
    ) {
      const fallback = pickBrowserRunCredentials({
        platformAccountId: process.env.CLOUDFLARE_BROWSER_RUN_ACCOUNT_ID,
        platformToken: process.env.CLOUDFLARE_BROWSER_RUN_TOKEN,
        userAccountId: workspace.cloudflareAccountId,
      });
      if (fallback.source !== "missing") {
        shot = await captureKitesurfScreenshot({
          accountId: fallback.accountId,
          targetUrl,
          token: fallback.token,
          viewport: args.viewport,
        });
      }
    }
    if (shot.kind !== "image") {
      const status = shot.kind === "forbidden" ? "needs_setup" : "error";
      const message =
        shot.kind === "forbidden"
          ? setupMessageFor(credentials.source)
          : shot.message || "Kitesurf で表示を取得できませんでした。";
      await ctx.runMutation(internal.workspacePreview.saveRender, {
        error: message,
        status,
        targetUrl,
        viewport: args.viewport,
        workspaceId: args.workspaceId,
      });
      return emptyRender(targetUrl, args.viewport, status, message);
    }
    const storageId = await ctx.storage.store(
      new Blob([Buffer.from(shot.bytes)], { type: shot.contentType })
    );
    await ctx.runMutation(internal.workspacePreview.saveRender, {
      imageStorageId: storageId,
      status: "ready",
      targetUrl,
      viewport: args.viewport,
      workspaceId: args.workspaceId,
    });
    const imageUrl: string | null = await ctx.runQuery(
      internal.workspacePreview.renderImageUrl,
      {
        storageId,
      }
    );
    return {
      browser: "kitesurf" as const,
      capturedAt: Date.now(),
      imageUrl,
      message: "",
      status: "ready" as const,
      targetUrl,
      viewport: args.viewport,
    };
  },
  returns: previewRenderValidator,
});
