import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const {
  convexCreateDeployKeyActionIds,
  convexCreateDeployKeyInput,
  convexCreateProjectActionIds,
  convexCreateProjectInput,
  convexDeleteProjectInput,
  convexDeleteProjectInputs,
  convexNumericProjectId,
  convexTeamIdFromAccount,
  firstConvexTeamId,
  githubCreateOrUpdateFileActionIds,
  githubCreateOrUpdateFileInput,
  githubCreateRepositoryActionIds,
  githubCreateRepositoryInput,
} = await import("../../../convex/lib/openConnectorActionInputs.ts");

const createInput = githubCreateRepositoryInput({
  description: "test",
  name: "flowcheck-915",
});

assert.equal(createInput.autoInit, false);
assert.equal(Object.hasOwn(createInput, "auto_init"), false);
assert.equal(createInput.name, "flowcheck-915");
assert.equal(githubCreateRepositoryActionIds[0], "github.create_repository");
assert.equal(
  githubCreateOrUpdateFileActionIds[0],
  "github.create_or_update_file"
);

const knownFileBase64 = "eyJuYW1lIjoiZmxvd2NoZWNrIn0=";
const fileInput = githubCreateOrUpdateFileInput({
  contentBase64: knownFileBase64,
  message: "tahcode 由来の足場を置く",
  owner: "MichitoSugawara",
  path: "package.json",
  repo: "flowcheck-955",
});
assert.equal(fileInput.contentBase64, knownFileBase64);
assert.equal(Object.hasOwn(fileInput, "content"), false);
assert.equal(fileInput.owner, "MichitoSugawara");
assert.equal(fileInput.path, "package.json");
assert.equal(fileInput.repo, "flowcheck-955");
assert.equal(fileInput.message, "tahcode 由来の足場を置く");

const convexInput = convexCreateProjectInput({
  projectName: "flowcheck-915",
  teamId: 46_534,
});
assert.equal(convexInput.team_id, 46_534);
assert.equal(convexInput.projectName, "flowcheck-915");
assert.equal(convexCreateProjectActionIds[0], "convex.create_project");
const deployKeyInput = convexCreateDeployKeyInput({
  deploymentName: "happy-animal-123",
  name: "adhd-pages-demo",
});
assert.equal(deployKeyInput.deployment_name, "happy-animal-123");
assert.equal(deployKeyInput.name, "adhd-pages-demo");
assert.equal(Object.hasOwn(deployKeyInput, "deploymentName"), false);
assert.equal(convexCreateDeployKeyActionIds[0], "convex.create_deploy_key");
assert.equal(convexTeamIdFromAccount("team:46534"), 46_534);
assert.equal(convexTeamIdFromAccount("46534"), 46_534);
assert.equal(convexTeamIdFromAccount("conn_abc"), undefined);
assert.equal(firstConvexTeamId(["conn_abc", "team:46534"]), 46_534);
assert.equal(convexNumericProjectId("46534"), 46_534);
assert.equal(typeof convexNumericProjectId("46534"), "number");
assert.equal(convexNumericProjectId("notes-app"), undefined);
const convexDeleteInput = convexDeleteProjectInput({ projectId: "46534" });
assert.equal(convexDeleteInput.project_id, 46_534);
assert.equal(typeof convexDeleteInput.project_id, "number");
assert.equal(Object.hasOwn(convexDeleteInput, "projectId"), false);
assert.deepEqual(convexDeleteProjectInputs("46534"), [
  { project_id: 46_534 },
  { projectId: 46_534 },
]);

const convexLib = path.resolve(import.meta.dirname, "../../../convex");
const githubOc = await readFile(
  path.join(convexLib, "lib/githubFromOpenConnector.ts"),
  "utf8"
);
const githubRepo = await readFile(
  path.join(convexLib, "lib/githubRepo.ts"),
  "utf8"
);
const workspaceActions = await readFile(
  path.join(convexLib, "workspaceActions.ts"),
  "utf8"
);

assert.match(githubOc, /githubCreateRepositoryInput/);
assert.match(githubOc, /githubCreateOrUpdateFileInput/);
const putFileFn = githubOc.slice(
  githubOc.indexOf("const putFile"),
  githubOc.indexOf("export const seedRepoViaOpenConnector")
);
assert.match(putFileFn, /content: utf8ToBase64\(args\.content\)/);
assert.match(putFileFn, /contentBase64: body\.content/);
const putGitHubFileFn = githubRepo.slice(
  githubRepo.indexOf("export const putGitHubFile"),
  githubRepo.indexOf("export const createGitHubRepo")
);
assert.match(putGitHubFileFn, /content: utf8ToBase64\(args\.content\)/);
const createRepoFn = githubOc.slice(
  githubOc.indexOf("const createRepo"),
  githubOc.indexOf("const createFromTemplate")
);
assert.match(createRepoFn, /githubCreateRepositoryInput/);
assert.doesNotMatch(createRepoFn.split("proxyOpenConnector")[0], /auto_init/);
assert.match(createRepoFn, /auto_init: false/);
assert.doesNotMatch(githubOc, /template_owner/);
assert.match(githubOc, /createRepo\(/);
assert.match(workspaceActions, /loadConnectorOrToken/);
assert.match(workspaceActions, /ensureConvexProjectViaOpenConnector/);
assert.match(
  workspaceActions,
  /loadConnectorOrToken\(ctx, args.userId, "convex"\)/
);

console.log("oc provision inputs ok");
