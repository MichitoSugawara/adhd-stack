import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const source = path.resolve(
  import.meta.dirname,
  "../../../convex/lib/pagesEnvironments.ts"
);
const { pagesEnvironmentsFrom } = await import(pathToFileURL(source).href);

assert.deepEqual(
  pagesEnvironmentsFrom([
    { environment: "preview", url: "https://preview.pages.dev" },
    { environment: "production", url: "https://app.pages.dev" },
  ]),
  {
    previewUrl: "https://preview.pages.dev",
    productionUrl: "https://app.pages.dev",
  }
);

assert.deepEqual(
  pagesEnvironmentsFrom([
    { environment: "production", url: "https://app.pages.dev" },
    { environment: "preview", url: "https://a.pages.dev" },
    { environment: "preview", url: "https://b.pages.dev" },
  ]),
  {
    previewUrl: "https://a.pages.dev",
    productionUrl: "https://app.pages.dev",
  }
);

assert.deepEqual(pagesEnvironmentsFrom([{ environment: "preview" }]), {
  previewUrl: undefined,
  productionUrl: undefined,
});

assert.deepEqual(pagesEnvironmentsFrom([]), {
  previewUrl: undefined,
  productionUrl: undefined,
});

const pagesSource = await readFile(
  path.resolve(import.meta.dirname, "../../../convex/lib/cloudflarePages.ts"),
  "utf8"
);
assert.match(pagesSource, /preview_deployment_setting: "none"/);
assert.match(pagesSource, /listPagesEnvironments/);

console.log("pages environments ok");
