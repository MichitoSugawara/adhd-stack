import { tahcodeSeedFiles, templateRepoFromEnv } from "./appTemplate";
import type { TemplateKind } from "./appTemplate";
import {
  createGitHubRepoFromTemplate,
  ensureNamedRepo,
  putGitHubFile,
} from "./githubRepo";
import type { GitHubRepo } from "./githubRepo";

export const seedRepoViaToken = async (args: {
  name: string;
  repo: GitHubRepo;
  token: string;
}): Promise<void> => {
  const files = tahcodeSeedFiles({ name: args.name, slug: args.repo.repo });
  let wrote = 0;
  for (const file of files) {
    try {
      await putGitHubFile({
        content: file.content,
        message: "tahcode 由来の足場を置く",
        owner: args.repo.owner,
        path: file.path,
        repo: args.repo.repo,
        token: args.token,
      });
      wrote += 1;
    } catch {
      // One path may already exist; keep seeding the rest.
    }
  }
  if (wrote === 0) {
    throw new Error("テンプレート足場を書けませんでした");
  }
};

export const provisionGithubViaToken = async (args: {
  existingFullName?: string;
  name: string;
  slug: string;
  token: string;
}): Promise<{ repo: GitHubRepo; templateKind: TemplateKind }> => {
  if (args.existingFullName) {
    const ensured = await ensureNamedRepo({
      existingFullName: args.existingFullName,
      name: args.slug,
      token: args.token,
    });
    return { repo: ensured.repo, templateKind: "tahcode_seed" };
  }
  const description = "ADHD Stack が tahcode 由来で用意したリポジトリ";
  const template = templateRepoFromEnv();
  if (template) {
    const repo = await createGitHubRepoFromTemplate({
      description,
      name: args.slug,
      templateOwner: template.owner,
      templateRepo: template.repo,
      token: args.token,
    });
    return { repo, templateKind: "tahcode_template" };
  }
  const ensured = await ensureNamedRepo({
    name: args.slug,
    token: args.token,
  });
  await seedRepoViaToken({
    name: args.name,
    repo: ensured.repo,
    token: args.token,
  });
  return { repo: ensured.repo, templateKind: "tahcode_seed" };
};
