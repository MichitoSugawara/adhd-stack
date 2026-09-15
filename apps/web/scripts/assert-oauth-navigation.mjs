import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const source = await readFile(
  path.resolve(import.meta.dirname, "../components/screens/connect-screen.tsx"),
  "utf8"
);

assert.match(source, /window\.location\.assign\(started\.url\)/);
assert.match(source, /writePendingOc/);
assert.doesNotMatch(source, /noopener/);
assert.doesNotMatch(source, /window\.open\([\s\S]*?\)[\s\S]*?popup === null/);

const chatgptOpen = source.match(/window\.open\(([^)]+)\)/);
assert.ok(chatgptOpen);
assert.doesNotMatch(chatgptOpen[0], /noopener|noreferrer/);

console.log("oauth navigation ok");
