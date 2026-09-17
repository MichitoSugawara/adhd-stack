export const GITHUB_OAUTH_SCOPES = [
  "delete_repo",
  "read:user",
  "repo",
  "user:email",
] as const;

export const ensureGithubOauthScopes = (
  authorizationUrl: string,
  scopes: readonly string[] = GITHUB_OAUTH_SCOPES
): string => {
  let parsed: URL;
  try {
    parsed = new URL(authorizationUrl);
  } catch {
    return authorizationUrl;
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    return authorizationUrl;
  }
  const existing = (parsed.searchParams.get("scope") ?? "")
    .split(/[+\s,]/u)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const merged = new Set(existing);
  for (const scope of scopes) {
    merged.add(scope);
  }
  parsed.searchParams.set("scope", [...merged].join(" "));
  return parsed.toString();
};
