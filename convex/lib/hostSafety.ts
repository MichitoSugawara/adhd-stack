import {
  convexDeploymentNameForApi,
  deploymentNameFromConvexUrl,
} from "./convexProject";

export const HOST_WORKER_NAME = "adhd-stack";
export const HOST_CONVEX_DEPLOYMENT = "mild-boar-229";

const normalize = (value: string): string => value.trim().toLowerCase();

export const isHostGitHubRepo = (repo: string): boolean =>
  normalize(repo) === HOST_WORKER_NAME;

export const isHostPagesProject = (projectName: string): boolean =>
  normalize(projectName) === HOST_WORKER_NAME;

export const isHostConvexResource = (args: {
  deploymentName?: string;
  projectSlug?: string;
  url?: string;
}): boolean => {
  const names = [
    args.deploymentName
      ? convexDeploymentNameForApi(args.deploymentName)
      : undefined,
    deploymentNameFromConvexUrl(args.url),
    args.projectSlug,
  ]
    .filter((value): value is string => Boolean(value && value.length > 0))
    .map((value) => normalize(value));
  return names.includes(HOST_CONVEX_DEPLOYMENT);
};
