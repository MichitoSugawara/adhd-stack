"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { loadConnectorOrToken, loadFreshConnection } from "./lib/actionAuth";
import type { CloudflarePagesProject } from "./lib/cloudflarePages";
import {
  attachPagesGitHubSource,
  ensurePagesProject,
  getPagesDeployment,
  listPagesEnvironments,
  triggerPagesDeployment,
} from "./lib/cloudflarePages";
import {
  ensureConvexProjectViaOpenConnector,
  getConvexProductionDeploymentViaOpenConnector,
} from "./lib/convexFromOpenConnector";
import { pushConvexFunctionsViaPages } from "./lib/convexFunctionPush";
import {
  ensureConvexProject,
  getConvexProductionDeployment,
} from "./lib/convexProject";
import type { PagesRefreshResult, PublishResult } from "./lib/publishResult";
import {
  asStoredHttpUrl,
  noteForPagesOutcome,
  notesAfterPagesRefresh,
  PAGES_DEPLOY_STARTED_NOTE,
  pagesStatusFromStage,
  publishErrorAfterPagesRefresh,
  summarizePublish,
} from "./lib/publishResult";
import { reconnectMessage } from "./lib/tokenRefresh";
import { pagesRefreshValidator, publishResultValidator } from "./validators";

const listedPagesUrls = async (
  token: string,
  accountId: string,
  projectName: string
): Promise<{ previewUrl?: string; productionUrl?: string } | undefined> => {
  const listed = await listPagesEnvironments(token, accountId, projectName);
  if (!listed) {
    return undefined;
  }
  return {
    previewUrl: asStoredHttpUrl(listed.previewUrl) ?? undefined,
    productionUrl: asStoredHttpUrl(listed.productionUrl) ?? undefined,
  };
};

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
    let cloudflarePreviewUrl = asStoredHttpUrl(workspace.cloudflarePreviewUrl);
    let { cloudflareAccountId } = workspace;
    let { cloudflareProjectName } = workspace;
    let convexUrl = asStoredHttpUrl(workspace.convexUrl);
    let { convexDeploymentName } = workspace;
    let { convexProjectSlug } = workspace;
    let { convexTeamSlug } = workspace;
    let pagesProject: CloudflarePagesProject | undefined;

    const owner = workspace.githubOwner;
    const repo = workspace.githubRepoName;
    if (!(owner && repo && workspace.githubRepoUrl)) {
      errors.push("保存先がまだありません");
    }

    const cloudflare = await loadFreshConnection(
      ctx,
      args.userId,
      "cloudflare"
    );
    if (cloudflare && owner && repo) {
      try {
        pagesProject = await ensurePagesProject(
          cloudflare.accessToken,
          owner,
          repo,
          workspace.githubRepoId,
          cloudflare.accountId,
          workspace.cloudflareProjectName ?? workspace.slug
        );
        cloudflareAccountId = pagesProject.accountId;
        cloudflareProjectName = pagesProject.name;
        cloudflarePagesUrl =
          asStoredHttpUrl(pagesProject.url) ?? cloudflarePagesUrl;
        try {
          await attachPagesGitHubSource(
            cloudflare.accessToken,
            pagesProject.accountId,
            pagesProject.name,
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
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `Pages: ${error.message}`
            : "Pages: プロジェクトを用意できませんでした"
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
        const push = await pushConvexFunctionsViaPages({
          appSlug: workspace.slug,
          cloudflareAccountId: pagesProject?.accountId ?? cloudflareAccountId,
          cloudflareProjectName: pagesProject?.name ?? cloudflareProjectName,
          cloudflareToken: cloudflare?.accessToken,
          convex,
          convexUrl,
          deploymentName: convexDeploymentName,
        });
        notes.push(push.note);
        if (!convexUrl) {
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

    let { pagesDeployId, pagesDeployStatus } = workspace;

    if (cloudflare && pagesProject) {
      try {
        const deployment = await triggerPagesDeployment(
          cloudflare.accessToken,
          pagesProject.accountId,
          pagesProject.name
        );
        const {
          id: triggeredId,
          status: triggeredStatus,
          url: triggeredUrl,
        } = deployment;
        cloudflarePagesUrl =
          asStoredHttpUrl(triggeredUrl) ?? cloudflarePagesUrl;
        pagesDeployId = triggeredId ?? pagesDeployId;
        pagesDeployStatus = pagesStatusFromStage(triggeredStatus);
        if (pagesDeployStatus === "started") {
          notes.push(PAGES_DEPLOY_STARTED_NOTE);
        } else if (pagesDeployStatus === "failure") {
          notes.push("Pages のビルドは失敗しました。");
          errors.push("Pages: デプロイが失敗しました");
        } else {
          const outcome = noteForPagesOutcome("success", notes);
          if (outcome) {
            notes.push(outcome);
          }
        }
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `Pages: ${error.message}`
            : "Pages: デプロイを開始できませんでした"
        );
      }
      const listed = await listedPagesUrls(
        cloudflare.accessToken,
        pagesProject.accountId,
        pagesProject.name
      );
      if (listed) {
        cloudflarePagesUrl = listed.productionUrl ?? cloudflarePagesUrl;
        cloudflarePreviewUrl = listed.previewUrl;
      }
    }

    const result: PublishResult = {
      cloudflarePagesUrl: cloudflarePagesUrl ?? null,
      convexUrl: convexUrl ?? null,
      error: errors.length > 0 ? errors.join(" / ") : null,
      notes,
      pagesDeployStatus,
    };

    await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
      cloudflareAccountId,
      cloudflarePagesUrl,
      cloudflarePreviewUrl,
      cloudflareProjectName,
      convexDeploymentName,
      convexProjectSlug,
      convexTeamSlug,
      convexUrl,
      pagesDeployId,
      pagesDeployStatus,
      provisionStatus: workspace.provisionStatus,
      publishError: result.error ?? "",
      publishNotes: notes,
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

export const refreshPagesDeploy = internalAction({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args): Promise<PagesRefreshResult> => {
    const workspace = await ctx.runQuery(
      internal.workspaceInternal.getWorkspace,
      { workspaceId: args.workspaceId }
    );
    if (!workspace) {
      return {
        error: "アプリが見つかりません",
        notes: [],
        pagesDeployStatus: null,
        pagesUrl: null,
      };
    }
    const notes = [...(workspace.publishNotes ?? [])];
    const cloudflare = await loadFreshConnection(
      ctx,
      args.userId,
      "cloudflare"
    );
    const accountId = workspace.cloudflareAccountId;
    const projectName = workspace.cloudflareProjectName;
    if (!(cloudflare && accountId && projectName)) {
      return {
        error: cloudflare ? null : reconnectMessage("cloudflare"),
        notes,
        pagesDeployStatus: workspace.pagesDeployStatus ?? null,
        pagesUrl: asStoredHttpUrl(workspace.cloudflarePagesUrl) ?? null,
      };
    }
    const listed = await listedPagesUrls(
      cloudflare.accessToken,
      accountId,
      projectName
    );
    const deployment = await getPagesDeployment(
      cloudflare.accessToken,
      accountId,
      projectName,
      workspace.pagesDeployId
    );
    if (!deployment) {
      if (listed) {
        await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
          cloudflarePagesUrl:
            listed.productionUrl ?? workspace.cloudflarePagesUrl,
          cloudflarePreviewUrl: listed.previewUrl ?? "",
          provisionStatus: workspace.provisionStatus,
          workspaceId: args.workspaceId,
        });
      }
      return {
        error: null,
        notes,
        pagesDeployStatus: workspace.pagesDeployStatus ?? "started",
        pagesUrl:
          listed?.productionUrl ??
          asStoredHttpUrl(workspace.cloudflarePagesUrl) ??
          null,
      };
    }
    const pagesDeployStatus = pagesStatusFromStage(deployment.status);
    const pagesUrl =
      asStoredHttpUrl(deployment.url) ??
      asStoredHttpUrl(workspace.cloudflarePagesUrl) ??
      null;
    const outcome = noteForPagesOutcome(pagesDeployStatus, notes);
    const nextNotes = notesAfterPagesRefresh(notes, pagesDeployStatus, outcome);
    const publishError = publishErrorAfterPagesRefresh(
      pagesDeployStatus,
      workspace.publishError
    );
    await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
      cloudflarePagesUrl:
        listed?.productionUrl ?? pagesUrl ?? workspace.cloudflarePagesUrl,
      cloudflarePreviewUrl: listed
        ? (listed.previewUrl ?? "")
        : workspace.cloudflarePreviewUrl,
      pagesDeployId: deployment.id ?? workspace.pagesDeployId,
      pagesDeployStatus,
      provisionStatus: workspace.provisionStatus,
      publishError,
      publishNotes: nextNotes,
      workspaceId: args.workspaceId,
    });
    if (
      outcome &&
      workspace.pagesDeployStatus !== pagesDeployStatus &&
      pagesDeployStatus !== "started"
    ) {
      await ctx.runMutation(internal.workspaceInternal.insertSystemMessage, {
        body: outcome,
        workspaceId: args.workspaceId,
      });
    }
    return {
      error: pagesDeployStatus === "failure" ? publishError : null,
      notes: nextNotes,
      pagesDeployStatus,
      pagesUrl,
    };
  },
  returns: pagesRefreshValidator,
});
