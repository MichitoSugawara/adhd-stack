import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const {
  convexCreateProjectActionIds,
  convexCreateProjectInput,
  convexTeamIdFromAccount,
  firstConvexTeamId,
  githubCreateOrUpdateFileActionIds,
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

const convexInput = convexCreateProjectInput({
  projectName: "flowcheck-915",
  teamId: 46_534,
});
assert.equal(convexInput.team_id, 46_534);
assert.equal(convexInput.projectName, "flowcheck-915");
assert.equal(convexCreateProjectActionIds[0], "convex.create_project");
assert.equal(convexTeamIdFromAccount("team:46534"), 46_534);
assert.equal(convexTeamIdFromAccount("46534"), 46_534);
assert.equal(convexTeamIdFromAccount("conn_abc"), undefined);
assert.equal(firstConvexTeamId(["conn_abc", "team:46534"]), 46_534);

const convexLib = path.resolve(import.meta.dirname, "../../../convex");
const githubOc = await readFile(
  path.join(convexLib, "lib/githubFromOpenConnector.ts"),
  "utf8"
);
const workspaceActions = await readFile(
  path.join(convexLib, "workspaceActions.ts"),
  "utf8"
);

assert.match(githubOc, /githubCreateRepositoryInput/);
assert.match(githubOc, /githubCreateOrUpdateFileInput/);
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
