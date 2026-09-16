import { v } from "convex/values";

export const providerValidator = v.union(
  v.literal("chatgpt"),
  v.literal("cloudflare"),
  v.literal("convex"),
  v.literal("github")
);

export const connectionStatusValidator = v.union(
  v.literal("connected"),
  v.literal("disconnected")
);

export const provisionStatusValidator = v.union(
  v.literal("error"),
  v.literal("pending"),
  v.literal("provisioning"),
  v.literal("ready")
);

export const codingBackendValidator = v.union(
  v.literal("codex_cloud"),
  v.literal("cursor_cloud")
);

export const provisionStepValidator = v.union(
  v.literal("done"),
  v.literal("error"),
  v.literal("pending"),
  v.literal("running"),
  v.literal("skipped")
);

export const provisionStepsValidator = v.object({
  backend: provisionStepValidator,
  convex: provisionStepValidator,
  pages: provisionStepValidator,
  repo: provisionStepValidator,
  template: provisionStepValidator,
});

export const pagesDeployStatusValidator = v.union(
  v.literal("failure"),
  v.literal("started"),
  v.literal("success")
);

export const workspacePublicValidator = v.object({
  _id: v.id("workspaces"),
  cloudflarePagesUrl: v.optional(v.string()),
  cloudflarePreviewUrl: v.optional(v.string()),
  codingBackend: v.optional(codingBackendValidator),
  codingEnvironmentId: v.optional(v.string()),
  convexUrl: v.optional(v.string()),
  name: v.string(),
  pagesDeployStatus: v.optional(pagesDeployStatusValidator),
  provisionError: v.optional(v.string()),
  provisionStatus: provisionStatusValidator,
  provisionSteps: v.optional(provisionStepsValidator),
  publishError: v.optional(v.string()),
  publishNotes: v.optional(v.array(v.string())),
  ready: v.boolean(),
  slug: v.string(),
});

export const publishResultValidator = v.object({
  cloudflarePagesUrl: v.union(v.string(), v.null()),
  convexUrl: v.union(v.string(), v.null()),
  error: v.union(v.string(), v.null()),
  notes: v.array(v.string()),
  pagesDeployStatus: v.optional(pagesDeployStatusValidator),
});

export const pagesRefreshValidator = v.object({
  error: v.union(v.string(), v.null()),
  notes: v.array(v.string()),
  pagesDeployStatus: v.union(pagesDeployStatusValidator, v.null()),
  pagesUrl: v.union(v.string(), v.null()),
});

export const messageKindValidator = v.union(
  v.literal("command"),
  v.literal("diff"),
  v.literal("text"),
  v.literal("thinking"),
  v.literal("work")
);

export const messageRoleValidator = v.union(
  v.literal("assistant"),
  v.literal("system"),
  v.literal("user")
);

export const connectionPublicValidator = v.object({
  identity: v.string(),
  planWarning: v.optional(v.string()),
  provider: providerValidator,
  reconnectHint: v.optional(v.string()),
  status: connectionStatusValidator,
});

export const configuredValidator = v.object({
  chatgpt: v.boolean(),
  cloudflare: v.boolean(),
  convex: v.boolean(),
  github: v.boolean(),
});

export const ticketTokensValidator = v.object({
  accessToken: v.string(),
  expiresAt: v.optional(v.number()),
  refreshToken: v.optional(v.string()),
});

export const ticketOcValidator = v.object({
  connectedAccountId: v.optional(v.string()),
  connectionName: v.string(),
  displayLabel: v.optional(v.string()),
  service: v.string(),
});

export const ticketBackendValidator = v.union(
  v.literal("custom"),
  v.literal("openconnector")
);
