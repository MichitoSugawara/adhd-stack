import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const TARGETS = [
  path.join(ROOT, "components"),
  path.join(ROOT, "lib"),
  path.join(ROOT, "app"),
];
const SKIP_DIRS = new Set(["beautifui", "node_modules", ".next"]);
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"]);
const FORBIDDEN = [
  { label: "OpenConnector", pattern: /OpenConnector/u },
  { label: "OOMOL", pattern: /OOMOL/u },
  { label: "workers.dev", pattern: /workers\.dev/u },
  { label: "gateway", pattern: /\bgateway\b/iu },
  { label: "ゲートウェイ", pattern: /ゲートウェイ/u },
];

const collectFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(full)));
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
};

const violations = [];
for (const target of TARGETS) {
  const files = await collectFiles(target);
  for (const file of files) {
    const text = await readFile(file, "utf8");
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(text)) {
        violations.push(`${path.relative(ROOT, file)}: ${rule.label}`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error("UI copy ban failed:");
  for (const row of violations) {
    console.error(`  ${row}`);
  }
  process.exit(1);
}

console.log("UI copy ban ok");
