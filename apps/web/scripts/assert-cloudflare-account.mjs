import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const convexLib = path.resolve(import.meta.dirname, "../../../convex/lib");
const dir = await mkdtemp(path.join(tmpdir(), "cf-account-"));
await writeFile(
  path.join(dir, "httpJson.ts"),
  await readFile(path.join(convexLib, "httpJson.ts"), "utf8")
);
await writeFile(
  path.join(dir, "jwt.ts"),
  (await readFile(path.join(convexLib, "jwt.ts"), "utf8")).replaceAll(
    'from "./httpJson"',
    'from "./httpJson.ts"'
  )
);
await writeFile(
  path.join(dir, "cloudflareAccount.ts"),
  (await readFile(path.join(convexLib, "cloudflareAccount.ts"), "utf8"))
    .replaceAll('from "./httpJson"', 'from "./httpJson.ts"')
    .replaceAll('from "./jwt"', 'from "./jwt.ts"')
);

const {
  isExpiredCloudflareToken,
  pickCloudflareAccountId,
  resolveCloudflareAccountId,
} = await import(pathToFileURL(path.join(dir, "cloudflareAccount.ts")).href);

const accountId = "6000b09b2e9e73b4b4fb59056ccba860";
const memberships403 = {
  ok: false,
  payload: {
    errors: [{ code: 10_000, message: "Authentication error" }],
    success: false,
  },
  status: 403,
};
const accounts200 = {
  ok: true,
  payload: { result: [{ id: accountId }], success: true },
  status: 200,
};
const userinfo200 = {
  ok: true,
  payload: { sub: "9c63c0fde6d270eb1bc1f757fefe6cfb" },
  status: 200,
};

assert.equal(isExpiredCloudflareToken(403, memberships403.payload), false);
assert.equal(isExpiredCloudflareToken(401, { error: "invalid_token" }), true);

assert.equal(
  pickCloudflareAccountId({
    accounts: accounts200,
    hint: "cloudflare:9c63c0fde6d270eb1bc1f757fefe6cfb",
    memberships: memberships403,
    userinfo: userinfo200,
  }),
  accountId
);

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });

const fetcher = async (url) => {
  const href = String(url);
  if (href.includes("/memberships")) {
    return jsonResponse(403, memberships403.payload);
  }
  if (href.includes("/accounts")) {
    return jsonResponse(200, accounts200.payload);
  }
  if (href.includes("userinfo")) {
    return jsonResponse(200, userinfo200.payload);
  }
  throw new Error(href);
};

const resolved = await resolveCloudflareAccountId(
  "live-token",
  "cloudflare:9c63c0fde6d270eb1bc1f757fefe6cfb",
  fetcher
);
assert.equal(resolved.ok, true);
assert.equal(resolved.ok ? resolved.accountId : undefined, accountId);

const pages = await readFile(
  path.join(convexLib, "cloudflarePages.ts"),
  "utf8"
);
assert.match(pages, /resolveCloudflareAccountId/);
assert.doesNotMatch(pages, /memberships[\s\S]*isExpiredCloudflareToken/);

console.log("cloudflare account resolve ok");
