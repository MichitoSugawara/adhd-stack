export const githubCreateRepositoryActionIds = [
  "github.create_repository",
  "github.create_a_repository_for_the_authenticated_user",
  "github.repos_create_for_authenticated_user",
] as const;

export const githubCreateOrUpdateFileActionIds = [
  "github.create_or_update_file",
  "github.create_or_update_file_contents",
  "github.repos_create_or_update_file_contents",
] as const;

export const githubCreateFromTemplateActionIds = [
  "github.create_a_repository_using_a_template",
  "github.repos_create_using_a_template",
] as const;

export const githubDeleteRepositoryActionIds = [
  "github.delete_a_repository",
  "github.delete_repository",
  "github.repos_delete",
] as const;

export const githubDeleteRepositoryInput = (args: {
  owner: string;
  repo: string;
}): Record<string, unknown> => ({
  owner: args.owner,
  repo: args.repo,
});

export const convexDeleteProjectActionIds = [
  "convex.delete_project",
  "convex.delete_a_project",
] as const;

export const convexNumericProjectId = (
  projectId: string | undefined
): number | undefined => {
  if (!projectId) {
    return undefined;
  }
  const trimmed = projectId.trim();
  if (trimmed.length === 0 || !/^\d+$/u.test(trimmed)) {
    return undefined;
  }
  const numeric = Number(trimmed);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : undefined;
};

export const convexDeleteProjectInput = (args: {
  projectId: string;
}): Record<string, unknown> => {
  const projectId = convexNumericProjectId(args.projectId);
  if (projectId === undefined) {
    return {};
  }
  return { project_id: projectId };
};

export const convexDeleteProjectInputs = (
  projectId: string
): Record<string, unknown>[] => {
  const numeric = convexNumericProjectId(projectId);
  if (numeric === undefined) {
    return [];
  }
  return [{ project_id: numeric }, { projectId: numeric }];
};

export const convexCreateProjectActionIds = ["convex.create_project"] as const;

export const convexCreateDeployKeyActionIds = [
  "convex.create_deploy_key",
] as const;

export const githubCreateRepositoryInput = (args: {
  description: string;
  name: string;
}): Record<string, unknown> => ({
  autoInit: false,
  description: args.description,
  name: args.name,
  private: true,
});

export const githubCreateOrUpdateFileInput = (args: {
  contentBase64: string;
  message: string;
  owner: string;
  path: string;
  repo: string;
}): Record<string, unknown> => ({
  contentBase64: args.contentBase64,
  message: args.message,
  owner: args.owner,
  path: args.path,
  repo: args.repo,
});

export const githubCreateFromTemplateInput = (args: {
  name: string;
  owner: string;
  templateOwner: string;
  templateRepo: string;
}): Record<string, unknown> => ({
  name: args.name,
  owner: args.owner,
  private: true,
  templateOwner: args.templateOwner,
  templateRepo: args.templateRepo,
});

export const convexCreateProjectInput = (args: {
  projectName: string;
  teamId: number;
}): Record<string, unknown> => ({
  deploymentType: "prod",
  projectName: args.projectName,
  team_id: args.teamId,
});

export const convexCreateDeployKeyInput = (args: {
  deploymentName: string;
  name: string;
}): Record<string, unknown> => ({
  deployment_name: args.deploymentName,
  name: args.name,
});

export const convexTeamIdFromAccount = (value: string): number | undefined => {
  const trimmed = value.trim();
  const raw = trimmed.startsWith("team:")
    ? trimmed.slice("team:".length)
    : trimmed;
  if (raw.length === 0 || !/^\d+$/u.test(raw)) {
    return undefined;
  }
  const teamId = Number(raw);
  return Number.isInteger(teamId) ? teamId : undefined;
};

export const firstConvexTeamId = (
  values: readonly string[]
): number | undefined => {
  for (const value of values) {
    const teamId = convexTeamIdFromAccount(value);
    if (teamId !== undefined) {
      return teamId;
    }
  }
  return undefined;
};
