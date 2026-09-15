import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import { nextUniqueSlug, slugFromName } from "./lib/appSlug";
import {
  codingBackendValidator,
  messageKindValidator,
  messageRoleValidator,
  providerValidator,
  provisionStatusValidator,
  provisionStepsValidator,
} from "./validators";

const workspaceFields = {
  cloudflareAccountId: v.optional(v.string()),
  cloudflarePagesUrl: v.optional(v.string()),
  cloudflareProjectName: v.optional(v.string()),
  codexEnvironmentId: v.optional(v.string()),
  codingBackend: v.optional(codingBackendValidator),
  codingEnvironmentId: v.optional(v.string()),
  convexDeploymentName: v.optional(v.string()),
  convexProjectSlug: v.optional(v.string()),
  convexTeamSlug: v.optional(v.string()),
  convexUrl: v.optional(v.string()),
  githubOwner: v.optional(v.string()),
  githubRepoFullName: v.optional(v.string()),
  githubRepoId: v.optional(v.number()),
  githubRepoName: v.optional(v.string()),
  githubRepoUrl: v.optional(v.string()),
  provisionError: v.optional(v.string()),
  provisionStatus: provisionStatusValidator,
  provisionSteps: v.optional(provisionStepsValidator),
  slug: v.optional(v.string()),
  templateKind: v.optional(
    v.union(v.literal("tahcode_seed"), v.literal("tahcode_template"))
  ),
};

const workspaceDocValidator = v.object({
  ...workspaceFields,
  name: v.string(),
});

const usedSlugs = (rows: { name: string; slug?: string }[]): Set<string> =>
  new Set(rows.map((row) => row.slug ?? slugFromName(row.name)));

export const getWorkspace = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      return null;
    }
    return {
      cloudflareAccountId: workspace.cloudflareAccountId,
      cloudflarePagesUrl: workspace.cloudflarePagesUrl,
      cloudflareProjectName: workspace.cloudflareProjectName,
      codexEnvironmentId: workspace.codexEnvironmentId,
      codingBackend: workspace.codingBackend,
      codingEnvironmentId:
        workspace.codingEnvironmentId ?? workspace.codexEnvironmentId,
      convexDeploymentName: workspace.convexDeploymentName,
      convexProjectSlug: workspace.convexProjectSlug,
      convexTeamSlug: workspace.convexTeamSlug,
      convexUrl: workspace.convexUrl,
      githubOwner: workspace.githubOwner,
      githubRepoFullName: workspace.githubRepoFullName,
      githubRepoId: workspace.githubRepoId,
      githubRepoName: workspace.githubRepoName,
      githubRepoUrl: workspace.githubRepoUrl,
      name: workspace.name,
      provisionError: workspace.provisionError,
      provisionStatus: workspace.provisionStatus,
      provisionSteps: workspace.provisionSteps,
      slug: workspace.slug ?? slugFromName(workspace.name),
      templateKind: workspace.templateKind,
    };
  },
  returns: v.union(workspaceDocValidator, v.null()),
});

export const listIdsForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(50);
    return rows.map((row) => row._id);
  },
  returns: v.array(v.id("workspaces")),
});

export const getIdBySlug = internalQuery({
  args: { slug: v.string(), userId: v.id("users") },
  handler: async (ctx, args) => {
    const exact = await ctx.db
      .query("workspaces")
      .withIndex("by_user_and_slug", (q) =>
        q.eq("userId", args.userId).eq("slug", args.slug)
      )
      .unique();
    if (exact) {
      return exact._id;
    }
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(50);
    const match = rows.find(
      (row) => (row.slug ?? slugFromName(row.name)) === args.slug
    );
    return match?._id ?? null;
  },
  returns: v.union(v.id("workspaces"), v.null()),
});

export const ensureForUser = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(1);
    if (existing[0]) {
      return existing[0]._id;
    }
    const rows = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(50);
    const slug = nextUniqueSlug("workspace", usedSlugs(rows));
    return await ctx.db.insert("workspaces", {
      codingBackend: "codex_cloud",
      name: "アプリ",
      provisionStatus: "pending",
      slug,
      updatedAt: Date.now(),
      userId: args.userId,
    });
  },
  returns: v.id("workspaces"),
});

export const createNamedForUser = internalMutation({
  args: {
    codingBackend: codingBackendValidator,
    name: v.string(),
    slug: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) =>
    await ctx.db.insert("workspaces", {
      codingBackend: args.codingBackend,
      name: args.name,
      provisionStatus: "pending",
      provisionSteps: {
        backend: "pending",
        convex: "pending",
        pages: "pending",
        repo: "pending",
        template: "pending",
      },
      slug: args.slug,
      updatedAt: Date.now(),
      userId: args.userId,
    }),
  returns: v.id("workspaces"),
});

export const getConnectionSecret = internalQuery({
  args: {
    provider: providerValidator,
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("connections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .unique();
    if (!row || row.status !== "connected" || row.accessToken.length === 0) {
      return null;
    }
    return {
      accessToken: row.accessToken,
      accountId: row.accountId,
      expiresAt: row.expiresAt,
      identity: row.identity,
      refreshToken: row.refreshToken,
    };
  },
  returns: v.union(
    v.object({
      accessToken: v.string(),
      accountId: v.string(),
      expiresAt: v.optional(v.number()),
      identity: v.string(),
      refreshToken: v.optional(v.string()),
    }),
    v.null()
  ),
});

export const expireConnection = internalMutation({
  args: {
    provider: providerValidator,
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("connections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .unique();
    if (!row) {
      return null;
    }
    await ctx.db.patch(row._id, {
      accessToken: "",
      planWarning: undefined,
      refreshToken: undefined,
      status: "disconnected",
    });
    return null;
  },
  returns: v.null(),
});

export const saveConnectionTokens = internalMutation({
  args: {
    accessToken: v.string(),
    expiresAt: v.optional(v.number()),
    provider: providerValidator,
    refreshToken: v.optional(v.string()),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query("connections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .unique();
    if (!row) {
      throw new Error("Connection not found");
    }
    await ctx.db.patch(row._id, {
      accessToken: args.accessToken,
      expiresAt: args.expiresAt,
      refreshToken: args.refreshToken,
    });
    return null;
  },
  returns: v.null(),
});

export const patchWorkspace = internalMutation({
  args: {
    ...workspaceFields,
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }
    const { workspaceId, ...updates } = args;
    await ctx.db.patch(workspaceId, {
      ...updates,
      updatedAt: Date.now(),
    });
    return null;
  },
  returns: v.null(),
});

export const insertSystemMessage = internalMutation({
  args: {
    body: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      body: args.body,
      createdAt: Date.now(),
      kind: "text",
      role: "system",
      workspaceId: args.workspaceId,
    });
    return null;
  },
  returns: v.null(),
});

const messageMetaValidator = v.optional(
  v.object({
    additions: v.optional(v.number()),
    command: v.optional(v.string()),
    deletions: v.optional(v.number()),
    files: v.optional(v.array(v.string())),
  })
);

export const upsertArtifact = internalMutation({
  args: {
    body: v.string(),
    createdAt: v.optional(v.number()),
    externalId: v.string(),
    kind: messageKindValidator,
    meta: messageMetaValidator,
    role: messageRoleValidator,
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("messages")
      .withIndex("by_workspace_and_external", (q) =>
        q.eq("workspaceId", args.workspaceId).eq("externalId", args.externalId)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        body: args.body,
        kind: args.kind,
        meta: args.meta,
        role: args.role,
      });
      return existing._id;
    }
    return await ctx.db.insert("messages", {
      body: args.body,
      createdAt: args.createdAt ?? Date.now(),
      externalId: args.externalId,
      kind: args.kind,
      meta: args.meta,
      role: args.role,
      workspaceId: args.workspaceId,
    });
  },
  returns: v.id("messages"),
});
