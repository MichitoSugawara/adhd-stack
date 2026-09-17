import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const convexLib = path.resolve(import.meta.dirname, "../../../convex/lib");
const dir = await mkdtemp(path.join(tmpdir(), "cascade-delete-"));

const copyWithTsImports = async (name) => {
  const source = await readFile(path.join(convexLib, name), "utf8");
  await writeFile(
    path.join(dir, name),
    source.replaceAll(/from "(\.\/[^"]+)"/gu, 'from "$1.ts"')
  );
};

await copyWithTsImports("httpJson.ts");
await copyWithTsImports("convexProject.ts");
await copyWithTsImports("hostSafety.ts");
await copyWithTsImports("cascadeDeletePlan.ts");
await copyWithTsImports("cascadeDeleteResult.ts");
await copyWithTsImports("openConnectorActionInputs.ts");
await copyWithTsImports("openConnectorDeleteFallback.ts");

const { githubRepoFromUrl, githubRepoFromWorkspace, planCascadeDelete } =
  await import(pathToFileURL(path.join(dir, "cascadeDeletePlan.ts")).href);
const { cascadeResultFrom, shouldDeleteLocalRecords, summarizeCascadeResults } =
  await import(pathToFileURL(path.join(dir, "cascadeDeleteResult.ts")).href);
const { isHostConvexResource, isHostGitHubRepo, isHostPagesProject } =
  await import(pathToFileURL(path.join(dir, "hostSafety.ts")).href);

assert.deepEqual(githubRepoFromUrl("https://github.com/octo/notes-app"), {
  owner: "octo",
  repo: "notes-app",
});
assert.deepEqual(githubRepoFromUrl("https://github.com/octo/notes-app.git"), {
  owner: "octo",
  repo: "notes-app",
});
assert.equal(
  githubRepoFromUrl("https://example.com/octo/notes-app"),
  undefined
);

assert.deepEqual(
  githubRepoFromWorkspace({
    githubOwner: "octo",
    githubRepoName: "notes-app",
  }),
  { owner: "octo", repo: "notes-app" }
);
assert.deepEqual(
  githubRepoFromWorkspace({
    githubRepoFullName: "octo/notes-app",
  }),
  { owner: "octo", repo: "notes-app" }
);
assert.deepEqual(
  githubRepoFromWorkspace({
    githubRepoUrl: "https://github.com/octo/notes-app",
  }),
  { owner: "octo", repo: "notes-app" }
);

assert.equal(isHostGitHubRepo("adhd-stack"), true);
assert.equal(isHostGitHubRepo("notes-app"), false);
assert.equal(isHostPagesProject("adhd-stack"), true);
assert.equal(
  isHostConvexResource({
    deploymentName: "prod:mild-boar-229",
  }),
  true
);
assert.equal(
  isHostConvexResource({
    url: "https://mild-boar-229.convex.cloud",
  }),
  true
);
assert.equal(
  isHostConvexResource({
    projectSlug: "notes-app",
    url: "https://happy-animal-123.convex.cloud",
  }),
  false
);

const emptyPlan = planCascadeDelete({ name: "メモ" });
assert.deepEqual(
  emptyPlan.map((item) => [item.kind, item.decision]),
  [
    ["codex_environment", "skip"],
    ["cloudflare_pages", "skip"],
    ["github_repo", "skip"],
    ["convex_project", "skip"],
  ]
);

const fullPlan = planCascadeDelete({
  cloudflareAccountId: "acct",
  cloudflareProjectName: "notes-app",
  codingBackend: "codex_cloud",
  codingEnvironmentId: "env_123",
  convexDeploymentName: "happy-animal-123",
  convexProjectSlug: "notes-app",
  convexTeamSlug: "octo",
  githubOwner: "octo",
  githubRepoName: "notes-app",
});
assert.deepEqual(
  fullPlan.map((item) => [item.kind, item.decision]),
  [
    ["codex_environment", "delete"],
    ["cloudflare_pages", "delete"],
    ["github_repo", "delete"],
    ["convex_project", "delete"],
  ]
);
assert.equal(fullPlan[0]?.environmentId, "env_123");
assert.deepEqual(fullPlan[1]?.pages, {
  accountId: "acct",
  projectName: "notes-app",
});
assert.deepEqual(fullPlan[2]?.github, { owner: "octo", repo: "notes-app" });
assert.equal(fullPlan[3]?.convex?.projectSlug, "notes-app");

const hostPlan = planCascadeDelete({
  cloudflareProjectName: "adhd-stack",
  codingBackend: "cursor_cloud",
  codingEnvironmentId: "cursor-repo:https://github.com/octo/notes",
  convexDeploymentName: "mild-boar-229",
  convexProjectSlug: "notes-app",
  githubOwner: "MichitoSugawara",
  githubRepoName: "adhd-stack",
});
assert.equal(
  hostPlan.find((item) => item.kind === "github_repo")?.decision,
  "block"
);
assert.equal(
  hostPlan.find((item) => item.kind === "cloudflare_pages")?.decision,
  "block"
);
assert.equal(
  hostPlan.find((item) => item.kind === "convex_project")?.decision,
  "block"
);
assert.equal(
  hostPlan.find((item) => item.kind === "codex_environment")?.decision,
  "skip"
);

const failedRemote = [
  {
    kind: "github_repo",
    message: "保存先の接続が切れました。つなぎ直してください",
    reconnect: true,
    status: "failed",
  },
  {
    kind: "cloudflare_pages",
    message: "公開ページを消しました",
    reconnect: false,
    status: "deleted",
  },
  {
    kind: "convex_project",
    message: "アプリのデータを消しました",
    reconnect: false,
    status: "deleted",
  },
  {
    kind: "codex_environment",
    message: "実行環境を消しました",
    reconnect: false,
    status: "deleted",
  },
];
assert.equal(shouldDeleteLocalRecords(failedRemote), false);
const partial = cascadeResultFrom([
  ...failedRemote,
  {
    kind: "local_records",
    message: "この画面の記録は残しています",
    reconnect: true,
    status: "skipped",
  },
]);
assert.equal(partial.complete, false);
assert.equal(partial.localDeleted, false);

const honestComplete = summarizeCascadeResults([
  {
    kind: "github_repo",
    message: "保存先を消しました",
    reconnect: false,
    status: "deleted",
  },
  {
    kind: "cloudflare_pages",
    message: "公開ページはすでにありませんでした",
    reconnect: false,
    status: "already_gone",
  },
  {
    kind: "convex_project",
    message: "アプリのデータを消しました",
    reconnect: false,
    status: "deleted",
  },
  {
    kind: "codex_environment",
    message: "実行環境の削除 API が使えないため、残っている可能性があります",
    reconnect: false,
    status: "unsupported",
  },
  {
    kind: "local_records",
    message: "この画面の記録を消しました",
    reconnect: false,
    status: "deleted",
  },
]);
assert.equal(honestComplete.complete, true);
assert.equal(honestComplete.localDeleted, true);

const fakeSuccess = summarizeCascadeResults([
  {
    kind: "github_repo",
    message: "保存先を消せませんでした",
    reconnect: true,
    status: "failed",
  },
  {
    kind: "local_records",
    message: "この画面の記録を消しました",
    reconnect: false,
    status: "deleted",
  },
]);
assert.equal(fakeSuccess.complete, false);

const blocked = summarizeCascadeResults([
  {
    kind: "convex_project",
    message: "ホスト本体のデータは消しません",
    reconnect: false,
    status: "blocked",
  },
  {
    kind: "local_records",
    message: "この画面の記録を消しました",
    reconnect: false,
    status: "deleted",
  },
]);
assert.equal(blocked.complete, false);
assert.equal(blocked.localDeleted, true);

const { convexDeleteProjectInput, convexNumericProjectId } = await import(
  pathToFileURL(path.join(dir, "openConnectorActionInputs.ts")).href
);
const {
  deleteConvexProjectViaOpenConnector,
  isOpenConnectorActionSchemaMismatch,
  shouldFallThroughOpenConnectorDeleteToProxy,
} = await import(
  pathToFileURL(path.join(dir, "openConnectorDeleteFallback.ts")).href
);
const { GITHUB_DELETE_PERMISSION_MESSAGE, isGitHubDeletePermissionError } =
  await import("../../../convex/lib/githubDeletePermission.ts");
const { ensureGithubOauthScopes, GITHUB_OAUTH_SCOPES } =
  await import("../../../convex/lib/githubOauthScopes.ts");

assert.equal(convexNumericProjectId("18821"), 18_821);
assert.equal(
  typeof convexDeleteProjectInput({ projectId: "18821" }).project_id,
  "number"
);
assert.equal(
  isOpenConnectorActionSchemaMismatch(
    "Action input does not match the action schema."
  ),
  true
);
assert.equal(
  shouldFallThroughOpenConnectorDeleteToProxy(
    "Action input does not match the action schema."
  ),
  true
);
assert.equal(
  shouldFallThroughOpenConnectorDeleteToProxy(
    "unknown_action:convex.delete_project"
  ),
  true
);
assert.equal(
  shouldFallThroughOpenConnectorDeleteToProxy(
    "Convex チームを特定できませんでした"
  ),
  false
);

let invokeCalls = 0;
const proxyCalls = [];
const schemaMismatch = await deleteConvexProjectViaOpenConnector({
  connectionName: "adhd-pending-test-convex",
  deps: {
    invoke: async () => {
      invokeCalls += 1;
      throw new Error("Action input does not match the action schema.");
    },
    proxy: async (args) => {
      proxyCalls.push(args);
      return { data: { success: true }, status: 200 };
    },
  },
  projectId: "18821",
});
assert.equal(schemaMismatch.via, "proxy");
assert.equal(schemaMismatch.status, 200);
assert.ok(invokeCalls >= 1);
assert.equal(proxyCalls.length, 1);
assert.equal(proxyCalls[0]?.endpoint, "/projects/18821/delete");
assert.equal(proxyCalls[0]?.method, "POST");
assert.equal(proxyCalls[0]?.body, undefined);
assert.equal(proxyCalls[0]?.service, "convex");

const githubScopes = GITHUB_OAUTH_SCOPES;
assert.ok(githubScopes.includes("delete_repo"));
assert.ok(githubScopes.includes("repo"));
const missingDelete = ensureGithubOauthScopes(
  "https://github.com/login/oauth/authorize?client_id=abc&scope=repo+read%3Auser"
);
assert.match(missingDelete, /delete_repo/);
assert.match(missingDelete, /user%3Aemail|user:email/);
assert.equal(
  ensureGithubOauthScopes("https://dashboard.convex.dev/oauth/authorize/team"),
  "https://dashboard.convex.dev/oauth/authorize/team"
);
assert.equal(
  isGitHubDeletePermissionError(403, "Must have admin rights to Repository."),
  true
);
assert.equal(
  isGitHubDeletePermissionError(
    undefined,
    "unknown_action:github.delete_repository"
  ),
  false
);
assert.match(
  GITHUB_DELETE_PERMISSION_MESSAGE,
  /リポジトリを消す権限がありません。GitHub をつなぎ直し、削除権限（delete_repo \/ 管理者）を許可してください/
);

const teardownSource = await readFile(
  path.join(convexLib, "convexTeardown.ts"),
  "utf8"
);
assert.match(teardownSource, /deleteConvexProjectViaOpenConnector/);
assert.match(teardownSource, /args\.auth\.mode === "token"/);
assert.doesNotMatch(
  teardownSource.slice(teardownSource.indexOf("const deleteViaOpenConnector")),
  /if \(!message\.startsWith\("unknown_action:"\)\)/
);

const oauthSource = await readFile(path.join(convexLib, "../oauth.ts"), "utf8");
assert.match(oauthSource, /requestedScopes/);
assert.match(oauthSource, /ensureGithubOauthScopes/);
assert.match(oauthSource, /GITHUB_OAUTH_SCOPES/);

const githubTeardown = await readFile(
  path.join(convexLib, "githubTeardown.ts"),
  "utf8"
);
const githubPermission = await readFile(
  path.join(convexLib, "githubDeletePermission.ts"),
  "utf8"
);
assert.match(githubTeardown, /GITHUB_DELETE_PERMISSION_MESSAGE/);
assert.match(githubPermission, /delete_repo/);
assert.doesNotMatch(
  githubTeardown,
  /asString\(payload\.message\) \?\?[\s\S]*つなぎ直して/
);

console.log("cascade delete planner ok");
