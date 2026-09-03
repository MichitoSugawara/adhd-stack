"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import { loadFreshConnection } from "./lib/actionAuth";
import { ensurePagesProject } from "./lib/cloudflarePages";
import {
  ensureCodexEnvironment,
  resolveCodexAccountId,
} from "./lib/codexCloud";
import { ensureConvexProject } from "./lib/convexProject";
import { ensureAdhdRepo } from "./lib/githubRepo";

export const provisionWorkspace = internalAction({
  args: {
    force: v.optional(v.boolean()),
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(
      internal.workspaceInternal.getWorkspace,
      { workspaceId: args.workspaceId }
    );
    if (
      existing?.provisionStatus === "ready" &&
      existing.githubRepoUrl &&
      existing.codexEnvironmentId
    ) {
      return null;
    }
    if (existing?.provisionStatus === "provisioning" && !args.force) {
      return null;
    }

    await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
      provisionStatus: "provisioning",
      workspaceId: args.workspaceId,
    });

    try {
      const blockers: string[] = [];
      const warnings: string[] = [];
      let githubOwner = existing?.githubOwner;
      let githubRepoFullName = existing?.githubRepoFullName;
      let githubRepoId = existing?.githubRepoId;
      let githubRepoName = existing?.githubRepoName;
      let githubRepoUrl = existing?.githubRepoUrl;
      let codexEnvironmentId = existing?.codexEnvironmentId;
      let cloudflareAccountId = existing?.cloudflareAccountId;
      let cloudflarePagesUrl = existing?.cloudflarePagesUrl;
      let cloudflareProjectName = existing?.cloudflareProjectName;
      let convexDeploymentName = existing?.convexDeploymentName;
      let convexProjectSlug = existing?.convexProjectSlug;
      let convexTeamSlug = existing?.convexTeamSlug;
      let convexUrl = existing?.convexUrl;

      const github = await loadFreshConnection(ctx, args.userId, "github");
      if (github) {
        try {
          const repo = await ensureAdhdRepo(
            github.accessToken,
            existing?.githubRepoFullName
          );
          githubOwner = repo.owner;
          githubRepoFullName = repo.fullName;
          githubRepoId = repo.id;
          githubRepoName = repo.repo;
          githubRepoUrl = repo.htmlUrl;
          await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
            githubOwner,
            githubRepoFullName,
            githubRepoId,
            githubRepoName,
            githubRepoUrl,
            provisionStatus: "provisioning",
            workspaceId: args.workspaceId,
          });
          await ctx.runMutation(
            internal.workspaceInternal.insertSystemMessage,
            {
              body: `GitHub: ${repo.htmlUrl}`,
              workspaceId: args.workspaceId,
            }
          );
        } catch (error) {
          blockers.push(
            error instanceof Error
              ? error.message
              : "GitHub のプロビジョニングに失敗しました"
          );
        }
      } else {
        blockers.push("GitHub がつながっていません");
      }

      const chatgpt = await loadFreshConnection(ctx, args.userId, "chatgpt");
      if (githubOwner && githubRepoName && chatgpt) {
        try {
          const accountId = await resolveCodexAccountId(
            chatgpt.accessToken,
            chatgpt.accountId
          );
          const environment = await ensureCodexEnvironment(
            { accessToken: chatgpt.accessToken, accountId },
            githubOwner,
            githubRepoName,
            githubRepoId
          );
          codexEnvironmentId = environment.id;
          await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
            codexEnvironmentId,
            provisionStatus: "provisioning",
            workspaceId: args.workspaceId,
          });
          await ctx.runMutation(
            internal.workspaceInternal.insertSystemMessage,
            {
              body: `Codex Cloud 環境: ${environment.id}`,
              workspaceId: args.workspaceId,
            }
          );
        } catch (error) {
          blockers.push(
            error instanceof Error
              ? error.message
              : "Codex Cloud 環境を作成できませんでした"
          );
        }
      } else if (!chatgpt) {
        blockers.push("ChatGPT がつながっていません");
      }

      const cloudflare = await loadFreshConnection(
        ctx,
        args.userId,
        "cloudflare"
      );
      if (cloudflare && githubOwner && githubRepoName) {
        try {
          const project = await ensurePagesProject(
            cloudflare.accessToken,
            githubOwner,
            githubRepoName,
            githubRepoId,
            cloudflare.accountId
          );
          cloudflareAccountId = project.accountId;
          cloudflarePagesUrl = project.url;
          cloudflareProjectName = project.name;
        } catch (error) {
          warnings.push(
            error instanceof Error
              ? error.message
              : "Cloudflare Pages のプロビジョニングに失敗しました"
          );
        }
      }

      const convex = await loadFreshConnection(ctx, args.userId, "convex");
      if (convex) {
        try {
          const project = await ensureConvexProject(convex.accessToken);
          convexDeploymentName = project.deploymentName;
          convexProjectSlug = project.projectSlug;
          convexTeamSlug = project.teamSlug;
          convexUrl = project.url;
        } catch (error) {
          warnings.push(
            error instanceof Error
              ? error.message
              : "Convex プロジェクトのプロビジョニングに失敗しました"
          );
        }
      }

      const ready = Boolean(githubRepoUrl && codexEnvironmentId);
      const notes = ready ? warnings : [...blockers, ...warnings];
      await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
        cloudflareAccountId,
        cloudflarePagesUrl,
        cloudflareProjectName,
        codexEnvironmentId,
        convexDeploymentName,
        convexProjectSlug,
        convexTeamSlug,
        convexUrl,
        githubOwner,
        githubRepoFullName,
        githubRepoId,
        githubRepoName,
        githubRepoUrl,
        provisionError: notes.length > 0 ? notes.join(" / ") : "",
        provisionStatus: ready ? "ready" : "error",
        workspaceId: args.workspaceId,
      });
      await ctx.runMutation(internal.workspaceInternal.insertSystemMessage, {
        body: ready
          ? "準備できました。チャットで指示してください。"
          : notes.join(" / ") || "準備に失敗しました",
        workspaceId: args.workspaceId,
      });
      return null;
    } catch (error) {
      await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
        provisionError:
          error instanceof Error ? error.message : "準備に失敗しました",
        provisionStatus: "error",
        workspaceId: args.workspaceId,
      });
      throw error;
    }
  },
  returns: v.null(),
});
