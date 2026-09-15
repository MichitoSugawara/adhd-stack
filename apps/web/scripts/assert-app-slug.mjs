import assert from "node:assert/strict";

const slugFromName = (name) => {
  const trimmed = name.trim();
  const slug = trimmed
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "")
    .slice(0, 48);
  if (slug.length > 0) {
    return slug;
  }
  return "workspace";
};

const nextUniqueSlug = (base, used) => {
  if (!used.has(base)) {
    return base;
  }
  for (let index = 2; index < 100; index += 1) {
    const candidate = `${base}-${String(index)}`;
    if (!used.has(candidate)) {
      return candidate;
    }
  }
  return `${base}-more`;
};

assert.equal(slugFromName("Notes App"), "notes-app");
assert.equal(slugFromName("  Inbox  "), "inbox");
assert.equal(slugFromName("メモ"), "workspace");
assert.notEqual(slugFromName("メモ"), "adhd-app");
assert.notEqual(slugFromName("メモ"), "app");
assert.equal(nextUniqueSlug("notes", new Set(["notes"])), "notes-2");
assert.equal(nextUniqueSlug("notes", new Set(["notes", "notes-2"])), "notes-3");
assert.equal(nextUniqueSlug("inbox", new Set()), "inbox");

console.log("app slug ok");
