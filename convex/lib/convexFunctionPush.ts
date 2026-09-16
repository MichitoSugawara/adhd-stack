import type { ConnectorOrToken } from "./actionAuth";
import { configurePagesForConvexDeploy } from "./cloudflarePages";
import { createConvexDeployKeyViaOpenConnector } from "./convexFromOpenConnector";
import {
  createConvexDeployKeyWithToken,
  deploymentNameFromConvexUrl,
} from "./convexProject";
import type { FunctionPushStatus } from "./publishResult";
import { noteForFunctionPush } from "./publishResult";

export interface FunctionPushResult {
  deployKeyIssued: boolean;
  note: string;
  pagesEnvSet: boolean;
  status: FunctionPushStatus;
}

export const deployKeyNameForApp = (slug: string): string => {
  const stamp = crypto.randomUUID().replaceAll("-", "").slice(0, 8);
  return `adhd-pages-${slug}-${stamp}`.slice(0, 64);
};

export const resolveDeploymentNameForPush = (args: {
  convexUrl?: string;
  deploymentName?: string;
}): string | undefined =>
  args.deploymentName ?? deploymentNameFromConvexUrl(args.convexUrl);

const resultFor = (
  status: FunctionPushStatus,
  deployKeyIssued: boolean,
  pagesEnvSet: boolean,
  extra?: string
): FunctionPushResult => {
  const base = noteForFunctionPush(status);
  return {
    deployKeyIssued,
    note: extra ? `${base} ${extra}` : base,
    pagesEnvSet,
    status,
  };
};

export const pushConvexFunctionsViaPages = async (args: {
  appSlug: string;
  cloudflareAccountId?: string;
  cloudflareProjectName?: string;
  cloudflareToken?: string;
  convex: ConnectorOrToken;
  convexUrl?: string;
  deploymentName?: string;
}): Promise<FunctionPushResult> => {
  const deploymentName = resolveDeploymentNameForPush({
    convexUrl: args.convexUrl,
    deploymentName: args.deploymentName,
  });
  if (!deploymentName) {
    return resultFor("skipped", false, false);
  }
  let deployKey: string;
  try {
    deployKey =
      args.convex.mode === "token"
        ? await createConvexDeployKeyWithToken({
            deploymentName,
            name: deployKeyNameForApp(args.appSlug),
            token: args.convex.token,
          })
        : await createConvexDeployKeyViaOpenConnector({
            connectionName: args.convex.connectionName,
            deploymentName,
            name: deployKeyNameForApp(args.appSlug),
          });
  } catch (error) {
    const detail = error instanceof Error ? error.message : undefined;
    return resultFor("failed", false, false, detail);
  }
  if (
    !(
      args.cloudflareToken &&
      args.cloudflareAccountId &&
      args.cloudflareProjectName
    )
  ) {
    return resultFor("key_only", true, false);
  }
  try {
    await configurePagesForConvexDeploy({
      accountId: args.cloudflareAccountId,
      convexUrl: args.convexUrl,
      deployKey,
      deploymentName,
      projectName: args.cloudflareProjectName,
      token: args.cloudflareToken,
    });
    return resultFor("configured", true, true);
  } catch (error) {
    const detail = error instanceof Error ? error.message : undefined;
    return resultFor("key_only", true, false, detail);
  }
};
