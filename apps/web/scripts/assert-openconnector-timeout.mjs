import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const {
  isAbortLikeError,
  OPENCONNECTOR_FETCH_TIMEOUT_MS,
  OPENCONNECTOR_TIMEOUT_MESSAGE,
} = await import("../../../convex/lib/httpRetry.ts");
const { connectErrorMessage } = await import("../lib/connect-error.ts");

assert.equal(OPENCONNECTOR_FETCH_TIMEOUT_MS, 15_000);
assert.equal(
  OPENCONNECTOR_TIMEOUT_MESSAGE,
  "接続アプリが応答しません。もう一度試してください。"
);
assert.equal(isAbortLikeError(new Error("TimeoutError")), false);
assert.equal(
  isAbortLikeError(Object.assign(new Error("x"), { name: "AbortError" })),
  true
);
assert.equal(
  isAbortLikeError(Object.assign(new Error("x"), { name: "TimeoutError" })),
  true
);
assert.equal(
  connectErrorMessage(new Error("The operation was aborted")),
  OPENCONNECTOR_TIMEOUT_MESSAGE
);
assert.equal(
  connectErrorMessage(new Error(OPENCONNECTOR_TIMEOUT_MESSAGE)),
  OPENCONNECTOR_TIMEOUT_MESSAGE
);

const convexLib = path.resolve(import.meta.dirname, "../../../convex/lib");
const admin = await readFile(path.join(convexLib, "openConnector.ts"), "utf8");
const runtime = await readFile(
  path.join(convexLib, "openConnectorActions.ts"),
  "utf8"
);
assert.match(admin, /fetchWithTimeout/);
assert.match(admin, /OPENCONNECTOR_FETCH_TIMEOUT_MS/);
assert.match(runtime, /fetchWithTimeout/);
assert.match(runtime, /OPENCONNECTOR_FETCH_TIMEOUT_MS/);
assert.doesNotMatch(
  admin.slice(
    admin.indexOf("const adminFetch"),
    admin.indexOf("const shouldRetry")
  ),
  /await fetch\(`/
);

console.log("openconnector timeout ok");
