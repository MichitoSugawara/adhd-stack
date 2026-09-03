"use node";

import { v } from "convex/values";

import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";

const asRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};

const asString = (value: unknown): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined;

const provisionGitHub = async (
  token: string
): Promise<{ fullName: string; htmlUrl: string }> => {
  const created = await fetch("https://api.github.com/user/repos", {
    body: JSON.stringify({
      auto_init: true,
      description: "ADHD Stack が用意したリポジトリ",
      name: "adhd-app",
      private: true,
    }),
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "adhd-stack",
    },
    method: "POST",
  });
  const payload = asRecord(await created.json());
  if (created.ok) {
    const fullName = asString(payload.full_name);
    const htmlUrl = asString(payload.html_url);
    if (fullName && htmlUrl) {
      return { fullName, htmlUrl };
    }
  }
  if (created.status === 422) {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "adhd-stack",
      },
    });
    const user = asRecord(await userResponse.json());
    const login = asString(user.login);
    if (login) {
      return {
        fullName: `${login}/adhd-app`,
        htmlUrl: `https://github.com/${login}/adhd-app`,
      };
    }
  }
  throw new Error(
    asString(payload.message) ?? "GitHub リポジトリを作成できませんでした"
  );
};

const provisionCloudflare = async (
  token: string
): Promise<string | undefined> => {
  const accountsResponse = await fetch(
    "https://api.cloudflare.com/client/v4/accounts?per_page=1",
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  const accounts = asRecord(await accountsResponse.json());
  const { result } = accounts;
  const first = Array.isArray(result) ? asRecord(result[0]) : undefined;
  const accountId = asString(first?.id);
  if (!(accountsResponse.ok && accountId)) {
    return undefined;
  }
  const createResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`,
    {
      body: JSON.stringify({
        name: "adhd-app",
        production_branch: "main",
      }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );
  const created = asRecord(await createResponse.json());
  const project = asRecord(created.result);
  const subdomain = asString(project.subdomain);
  if (subdomain) {
    return `https://${subdomain}`;
  }
  if (createResponse.status === 409) {
    const existing = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/adhd-app`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const existingPayload = asRecord(await existing.json());
    const existingProject = asRecord(existingPayload.result);
    const existingSubdomain = asString(existingProject.subdomain);
    if (existingSubdomain) {
      return `https://${existingSubdomain}`;
    }
  }
  return undefined;
};

const provisionConvex = async (token: string): Promise<string | undefined> => {
  const response = await fetch("https://api.convex.dev/v1/create_project", {
    body: JSON.stringify({
      projectName: "adhd-app",
      team: "default",
    }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  if (!response.ok) {
    return undefined;
  }
  const payload = asRecord(await response.json());
  return (
    asString(payload.prodUrl) ??
    asString(payload.deploymentUrl) ??
    asString(payload.projectUrl)
  );
};

export const provisionWorkspace = internalAction({
  args: {
    userId: v.id("users"),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.runQuery(
      internal.workspaceInternal.getWorkspace,
      {
        workspaceId: args.workspaceId,
      }
    );
    if (existing?.provisionStatus === "ready" && existing.githubRepoUrl) {
      return null;
    }

    const errors: string[] = [];
    let githubRepoFullName: string | undefined;
    let githubRepoUrl: string | undefined;
    let cloudflarePagesUrl: string | undefined;
    let convexUrl: string | undefined;

    const github = await ctx.runQuery(
      internal.workspaceInternal.getConnectionSecret,
      { provider: "github", userId: args.userId }
    );
    if (github) {
      try {
        const repo = await provisionGitHub(github.accessToken);
        githubRepoFullName = repo.fullName;
        githubRepoUrl = repo.htmlUrl;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : "GitHub のプロビジョニングに失敗しました"
        );
      }
    } else {
      errors.push("GitHub がつながっていません");
    }

    const cloudflare = await ctx.runQuery(
      internal.workspaceInternal.getConnectionSecret,
      { provider: "cloudflare", userId: args.userId }
    );
    if (cloudflare) {
      try {
        cloudflarePagesUrl = await provisionCloudflare(cloudflare.accessToken);
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : "Cloudflare Pages のプロビジョニングに失敗しました"
        );
      }
    }

    const convex = await ctx.runQuery(
      internal.workspaceInternal.getConnectionSecret,
      { provider: "convex", userId: args.userId }
    );
    if (convex) {
      try {
        convexUrl = await provisionConvex(convex.accessToken);
      } catch (error) {
        errors.push(
          error instanceof Error
            ? error.message
            : "Convex プロジェクトのプロビジョニングに失敗しました"
        );
      }
    }

    const ready = Boolean(githubRepoUrl);
    await ctx.runMutation(internal.workspaceInternal.patchWorkspace, {
      cloudflarePagesUrl,
      convexUrl,
      githubRepoFullName,
      githubRepoUrl,
      provisionError: errors.length > 0 ? errors.join(" / ") : undefined,
      provisionStatus: ready ? "ready" : "error",
      workspaceId: args.workspaceId,
    });
    if (ready) {
      await ctx.runMutation(internal.workspaceInternal.insertSystemMessage, {
        body: "GitHub リポジトリを用意しました。チャットで指示してください。",
        workspaceId: args.workspaceId,
      });
    }
    return null;
  },
  returns: v.null(),
});
