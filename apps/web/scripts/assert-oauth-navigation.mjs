import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const connect = await readFile(
  path.join(root, "components/screens/connect-screen.tsx"),
  "utf8"
);
const navigation = await readFile(
  path.join(root, "lib/oauth-navigation.ts"),
  "utf8"
);

assert.match(connect, /openOauthTab/);
assert.match(connect, /writePendingOc/);
assert.match(connect, /setPendingOc\(pending\)/);
assert.doesNotMatch(connect, /noopener/);
assert.doesNotMatch(connect, /noreferrer/);
assert.doesNotMatch(navigation, /noopener/);
assert.doesNotMatch(navigation, /noreferrer/);
assert.match(navigation, /window\.open\(url, "_blank"\)/);
assert.match(navigation, /popup\.opener = null/);
assert.match(
  navigation,
  /if \(popup\) \{[\s\S]*opener = null[\s\S]*\}[\s\S]*window\.location\.assign\(url\)/
);
assert.doesNotMatch(
  navigation,
  /window\.open\([^)]*noopener[\s\S]*?if \(popup === null\)/
);

const oauth = await readFile(path.join(root, "../../convex/oauth.ts"), "utf8");
const githubScopes = await readFile(
  path.join(root, "../../convex/lib/githubOauthScopes.ts"),
  "utf8"
);
assert.match(githubScopes, /"delete_repo"/);
assert.match(oauth, /ensureGithubOauthScopes/);
assert.match(oauth, /requestedScopes/);
assert.match(oauth, /GITHUB_OAUTH_SCOPES/);

console.log("oauth navigation ok");
