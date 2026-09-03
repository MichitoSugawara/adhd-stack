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
  v.literal("ready")
);

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
  status: connectionStatusValidator,
});

export const configuredValidator = v.object({
  chatgpt: v.boolean(),
  cloudflare: v.boolean(),
  convex: v.boolean(),
  github: v.boolean(),
});
