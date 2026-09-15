export const slugFromName = (name: string): string => {
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

export const nextUniqueSlug = (
  base: string,
  used: ReadonlySet<string>
): string => {
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
