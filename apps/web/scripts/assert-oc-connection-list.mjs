import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const convexLib = path.resolve(import.meta.dirname, "../../../convex/lib");
const dir = await mkdtemp(path.join(tmpdir(), "oc-parse-"));
await writeFile(
  path.join(dir, "httpJson.ts"),
  await readFile(path.join(convexLib, "httpJson.ts"), "utf8")
);
await writeFile(
  path.join(dir, "openConnectorParse.ts"),
  (
    await readFile(path.join(convexLib, "openConnectorParse.ts"), "utf8")
  ).replaceAll('from "./httpJson"', 'from "./httpJson.ts"')
);

const { asRecord, readJson } = await import(
  pathToFileURL(path.join(dir, "httpJson.ts")).href
);
const { extractPayloadItems, findOcConnection, parseOcConnectionList } =
  await import(pathToFileURL(path.join(dir, "openConnectorParse.ts")).href);

const connectionName = "adhd-pending-test-github";
const githubRow = {
  connectionName,
  id: "conn_github_1",
  profile: { login: "michito" },
  service: "github",
};

const findGithub = (payload) =>
  findOcConnection(parseOcConnectionList(payload), "github", connectionName);

assert.equal(findGithub([githubRow])?.id, "conn_github_1");
assert.equal(extractPayloadItems([githubRow]).length, 1);

assert.equal(findGithub({ connections: [githubRow] })?.id, "conn_github_1");
assert.equal(findGithub({ data: [githubRow] })?.id, "conn_github_1");
assert.equal(findGithub({ items: [githubRow] })?.id, "conn_github_1");
assert.equal(
  findGithub({ data: { connections: [githubRow] } })?.id,
  "conn_github_1"
);

assert.deepEqual(asRecord([githubRow]), {});
assert.equal(asRecord(githubRow).service, "github");

const arrayPayload = await readJson(
  new Response(JSON.stringify([githubRow]), {
    headers: { "content-type": "application/json" },
  })
);
assert.ok(Array.isArray(arrayPayload.items));
assert.equal(findGithub(arrayPayload)?.connectionName, connectionName);

const objectPayload = await readJson(
  new Response(JSON.stringify({ connections: [githubRow] }))
);
assert.equal(findGithub(objectPayload)?.id, "conn_github_1");

const dataPayload = await readJson(
  new Response(JSON.stringify({ data: [githubRow] }))
);
assert.equal(findGithub(dataPayload)?.id, "conn_github_1");

console.log("oc connection list parse ok");
