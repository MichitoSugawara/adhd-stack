import { asRecord, asString } from "./httpJson";

export const CONVEX_PAGES_BUILD_COMMAND =
  'npx convex deploy --yes --cmd "npm run build"';

export interface PagesEnvVar {
  type: "plain_text" | "secret_text";
  value?: string;
}

export const mergePagesProductionEnvVars = (
  existing: Record<string, unknown>,
  updates: Record<string, PagesEnvVar>
): Record<string, PagesEnvVar> => {
  const merged: Record<string, PagesEnvVar> = {};
  for (const [key, raw] of Object.entries(existing)) {
    const row = asRecord(raw);
    const type =
      asString(row.type) === "secret_text" ? "secret_text" : "plain_text";
    if (type === "secret_text") {
      merged[key] = { type: "secret_text" };
      continue;
    }
    const value = asString(row.value);
    if (value !== undefined) {
      merged[key] = { type: "plain_text", value };
    }
  }
  return { ...merged, ...updates };
};

export const mergePagesBuildConfig = (
  existing: Record<string, unknown>,
  buildCommand: string
): Record<string, unknown> => {
  const destination =
    asString(existing.destination_dir) ?? asString(existing.destinationDir);
  return {
    ...existing,
    build_command: buildCommand,
    ...(destination === undefined ? {} : { destination_dir: destination }),
  };
};

export const pagesConvexEnvUpdates = (args: {
  convexUrl?: string;
  deployKey: string;
  deploymentName?: string;
}): Record<string, PagesEnvVar> => {
  const updates: Record<string, PagesEnvVar> = {
    CONVEX_DEPLOY_KEY: { type: "secret_text", value: args.deployKey },
  };
  if (args.convexUrl) {
    updates.CONVEX_URL = { type: "plain_text", value: args.convexUrl };
    updates.NEXT_PUBLIC_CONVEX_URL = {
      type: "plain_text",
      value: args.convexUrl,
    };
  }
  if (args.deploymentName) {
    updates.CONVEX_DEPLOYMENT = {
      type: "plain_text",
      value: args.deploymentName,
    };
  }
  return updates;
};
