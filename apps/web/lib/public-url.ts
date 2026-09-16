export const publicHttpUrl = (
  value: string | undefined | null
): string | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
};

export const hostOf = (href: string): string => {
  try {
    return new URL(href).host;
  } catch {
    return href;
  }
};

export const previewUrlsFrom = (
  previewUrl?: string | null,
  previewUrls?: readonly string[]
): string[] => {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const value of [previewUrl, ...(previewUrls ?? [])]) {
    const href = publicHttpUrl(value);
    if (!href || seen.has(href)) {
      continue;
    }
    seen.add(href);
    urls.push(href);
  }
  return urls;
};
