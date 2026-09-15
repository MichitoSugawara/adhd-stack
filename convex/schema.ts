import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

import {
  codingBackendValidator,
  connectionStatusValidator,
  messageKindValidator,
  messageRoleValidator,
  providerValidator,
  provisionStatusValidator,
  provisionStepsValidator,
} from "./validators";

export default defineSchema({
  ...authTables,
  connections: defineTable({
    accessToken: v.string(),
    accountId: v.string(),
    connectedAt: v.number(),
    expiresAt: v.optional(v.number()),
    identity: v.string(),
    planWarning: v.optional(v.string()),
    provider: providerValidator,
    refreshToken: v.optional(v.string()),
    status: connectionStatusValidator,
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_provider", ["userId", "provider"])
    .index("by_provider", ["provider"])
    .index("by_account_id", ["accountId"])
    .index("by_identity", ["identity"]),
  connectorConnections: defineTable({
    backend: v.literal("openconnector"),
    connectedAccountId: v.string(),
    connectedAt: v.number(),
    connectionName: v.string(),
    displayLabel: v.string(),
    lastCheckedAt: v.optional(v.number()),
    provider: providerValidator,
    status: connectionStatusValidator,
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_provider", ["userId", "provider"])
    .index("by_connection_name", ["connectionName"])
    .index("by_connected_account", ["connectedAccountId"]),
  messages: defineTable({
    body: v.string(),
    createdAt: v.number(),
    externalId: v.optional(v.string()),
    kind: messageKindValidator,
    meta: v.optional(
      v.object({
        additions: v.optional(v.number()),
        command: v.optional(v.string()),
        deletions: v.optional(v.number()),
        files: v.optional(v.array(v.string())),
      })
    ),
    role: messageRoleValidator,
    workspaceId: v.id("workspaces"),
  })
    .index("by_workspace_and_created", ["workspaceId", "createdAt"])
    .index("by_workspace_and_external", ["workspaceId", "externalId"]),
  oauthStates: defineTable({
    codeVerifier: v.string(),
    expiresAt: v.number(),
    provider: providerValidator,
    state: v.string(),
    userId: v.optional(v.id("users")),
  })
    .index("by_state", ["state"])
    .index("by_expires", ["expiresAt"]),
  oauthTickets: defineTable({
    accountKey: v.string(),
    backend: v.optional(
      v.union(v.literal("custom"), v.literal("openconnector"))
    ),
    connectionAccountId: v.optional(v.string()),
    consumed: v.boolean(),
    email: v.optional(v.string()),
    expiresAt: v.number(),
    identity: v.string(),
    name: v.optional(v.string()),
    oc: v.optional(
      v.object({
        connectedAccountId: v.optional(v.string()),
        connectionName: v.string(),
        displayLabel: v.optional(v.string()),
        service: v.string(),
      })
    ),
    pendingProvider: providerValidator,
    planWarning: v.optional(v.string()),
    ticket: v.string(),
    tokens: v.optional(
      v.object({
        accessToken: v.string(),
        expiresAt: v.optional(v.number()),
        refreshToken: v.optional(v.string()),
      })
    ),
  })
    .index("by_ticket", ["ticket"])
    .index("by_account_key", ["accountKey"]),
  workspaces: defineTable({
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
    name: v.string(),
    provisionError: v.optional(v.string()),
    provisionStatus: provisionStatusValidator,
    provisionSteps: v.optional(provisionStepsValidator),
    publishError: v.optional(v.string()),
    slug: v.optional(v.string()),
    templateKind: v.optional(
      v.union(v.literal("tahcode_seed"), v.literal("tahcode_template"))
    ),
    updatedAt: v.number(),
    userId: v.id("users"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_slug", ["userId", "slug"])
    .index("by_github_owner", ["githubOwner"]),
});
