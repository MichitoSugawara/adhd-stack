"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { loadConnectorOrToken, loadFreshConnection } from "./lib/actionAuth";
import {
  attachPagesGitHubSource,
  ensurePagesProject,
  triggerPagesDeployment,
} from "./lib/cloudflarePages";
import {
  ensureConvexProjectViaOpenConnector,
  getConvexProductionDeploymentViaOpenConnector,
} from "./lib/convexFromOpenConnector";
import {
  ensureConvexProject,
  getConvexProductionDeployment,
} from "./lib/convexProject";
import type { PublishResult } from "./lib/publishResult";
import {
  asStoredHttpUrl,
  CONVEX_FUNCTION_PUSH_NOTE,
  summarizePublish,
} from "./lib/publishResult";
import { reconnectMessage } from "./lib/tokenRefresh";
import { publishResultValidator } from "./validators";

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
        error: "アプリが見つかりません",
        notes: [],
      };
    }

    const errors: string[] = [];
    const notes: string[] = [];
    let cloudflarePagesUrl = asStoredHttpUrl(workspace.cloudflarePagesUrl);
    let { cloudflareAccountId } = workspace;
    let { cloudflareProjectName } = workspace;
    let convexUrl = asStoredHttpUrl(workspace.convexUrl);
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
        cloudflarePagesUrl = asStoredHttpUrl(project.url) ?? cloudflarePagesUrl;
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
        cloudflarePagesUrl =
          asStoredHttpUrl(deployment.url) ?? cloudflarePagesUrl;
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

    const convex = await loadConnectorOrToken(ctx, args.userId, "convex");
    if (convex) {
      try {
        const projectName =
          workspace.convexProjectSlug ?? workspace.slug ?? "workspace";
        const project =
          convex.mode === "token"
            ? await ensureConvexProject(convex.token, projectName)
            : await ensureConvexProjectViaOpenConnector({
                accountHints: convex.accountHints,
                connectionName: convex.connectionName,
                projectName,
              });
        const deployment =
          convex.mode === "token"
            ? await getConvexProductionDeployment(
                convex.token,
                project.teamId,
                project.projectSlug
              )
            : await getConvexProductionDeploymentViaOpenConnector({
                connectionName: convex.connectionName,
                projectSlug: project.projectSlug,
                teamId: project.teamId,
              });
        convexDeploymentName = deployment.name ?? project.deploymentName;
        convexProjectSlug = project.projectSlug;
        convexTeamSlug = project.teamSlug;
        convexUrl =
          asStoredHttpUrl(deployment.url) ?? asStoredHttpUrl(project.url);
        if (convexUrl) {
          notes.push(CONVEX_FUNCTION_PUSH_NOTE);
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

    const result: PublishResult = {
      cloudflarePagesUrl: cloudflarePagesUrl ?? null,
      convexUrl: convexUrl ?? null,
      error: errors.length > 0 ? errors.join(" / ") : null,
      notes,
    };

    await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
      cloudflareAccountId,
      cloudflarePagesUrl,
      cloudflareProjectName,
      convexDeploymentName,
      convexProjectSlug,
      convexTeamSlug,
      convexUrl,
      provisionStatus: workspace.provisionStatus,
      publishError: result.error ?? "",
      workspaceId: args.workspaceId,
    });
    await ctx.runMutation(internal.workspaceInternal.insertSystemMessage, {
      body: summarizePublish(result),
      workspaceId: args.workspaceId,
    });

    return result;
  },
  returns: publishResultValidator,
});
