"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { loadFreshConnection } from "./lib/actionAuth";
import {
  attachPagesGitHubSource,
  ensurePagesProject,
  triggerPagesDeployment,
} from "./lib/cloudflarePages";
import {
  ensureConvexProject,
  getConvexProductionDeployment,
} from "./lib/convexProject";
import type { PublishResult } from "./lib/publishResult";
import { reconnectMessage } from "./lib/tokenRefresh";

const publishResultValidator = v.object({
  cloudflarePagesUrl: v.union(v.string(), v.null()),
  convexUrl: v.union(v.string(), v.null()),
  error: v.union(v.string(), v.null()),
});

export const publishWorkspace = internalAction({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<PublishResult> => {
    const workspace = await ctx.runQuery(
      internal.workspaceInternal.getWorkspace,
      { workspaceId: args.workspaceId }
    );
    if (!workspace) {
      return {
        cloudflarePagesUrl: null,
        convexUrl: null,
        error: "ワークスペースがありません",
      };
    }

    const errors: string[] = [];
    let { cloudflarePagesUrl } = workspace;
    let { cloudflareAccountId } = workspace;
    let { cloudflareProjectName } = workspace;
    let { convexUrl } = workspace;
    let { convexDeploymentName } = workspace;
    let { convexProjectSlug } = workspace;
    let { convexTeamSlug } = workspace;

    const owner = workspace.githubOwner;
    const repo = workspace.githubRepoName;
    if (!(owner && repo && workspace.githubRepoUrl)) {
      errors.push("GitHub リポジトリがまだありません");
    }

    const cloudflare = await loadFreshConnection(
      ctx,
      args.userId,
      "cloudflare"
    );
    if (cloudflare && owner && repo) {
      try {
        const project = await ensurePagesProject(
          cloudflare.accessToken,
          owner,
          repo,
          workspace.githubRepoId,
          cloudflare.accountId,
          workspace.cloudflareProjectName ?? workspace.slug
        );
        cloudflareAccountId = project.accountId;
        cloudflareProjectName = project.name;
        cloudflarePagesUrl = project.url ?? cloudflarePagesUrl;
        try {
          await attachPagesGitHubSource(
            cloudflare.accessToken,
            project.accountId,
            project.name,
            owner,
            repo,
            workspace.githubRepoId
          );
        } catch (error) {
          errors.push(
            error instanceof Error
              ? `Pages: ${error.message}`
              : "Pages: GitHub 連携に失敗しました"
          );
        }
        const deployment = await triggerPagesDeployment(
          cloudflare.accessToken,
          project.accountId,
          project.name
        );
        cloudflarePagesUrl = deployment.url ?? cloudflarePagesUrl;
        if (deployment.status === "failure" || deployment.status === "failed") {
          errors.push("Pages: デプロイが失敗しました");
        }
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `Pages: ${error.message}`
            : "Pages: デプロイを開始できませんでした"
        );
      }
    } else if (!cloudflare) {
      errors.push(reconnectMessage("cloudflare"));
    }

    const convex = await loadFreshConnection(ctx, args.userId, "convex");
    if (convex) {
      try {
        const project = await ensureConvexProject(
          convex.accessToken,
          workspace.convexProjectSlug ?? workspace.slug
        );
        const deployment = await getConvexProductionDeployment(
          convex.accessToken,
          project.teamId,
          project.projectSlug
        );
        convexDeploymentName = deployment.name ?? project.deploymentName;
        convexProjectSlug = project.projectSlug;
        convexTeamSlug = project.teamSlug;
        convexUrl = deployment.url ?? project.url;
        if (convexUrl) {
          errors.push(
            "Convex: プロジェクトと本番デプロイはあります。関数のプッシュはこのサーバーからバンドルできないため未実施です。"
          );
        } else {
          errors.push(
            "Convex: 本番デプロイ URL を取得できませんでした。プロジェクトはあります。"
          );
        }
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `Convex: ${error.message}`
            : "Convex: プロジェクトを用意できませんでした"
        );
      }
    } else {
      errors.push("Convex: つながっていません");
    }

    await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
      cloudflareAccountId,
      cloudflarePagesUrl,
      cloudflareProjectName,
      convexDeploymentName,
      convexProjectSlug,
      convexTeamSlug,
      convexUrl,
      provisionStatus: workspace.provisionStatus,
      workspaceId: args.workspaceId,
    });

    const blocking = errors.filter(
      (item) => !item.startsWith("Convex: プロジェクトと本番デプロイ")
    );
    return {
      cloudflarePagesUrl: cloudflarePagesUrl ?? null,
      convexUrl: convexUrl ?? null,
      error: blocking.length > 0 ? errors.join(" / ") : (errors[0] ?? null),
    };
  },
  returns: publishResultValidator,
});
