import type { Doc } from "../_generated/dataModel";

export const normalizePersonKey = (value: string): string =>
  value.replaceAll(/[^a-z0-9]/giu, "").toLowerCase();

export const looksLikeEmail = (value: string): boolean =>
  value.includes("@") && value.includes(".");

export const githubLoginFromIdentity = (
  identity: string
): string | undefined => {
  const trimmed = identity.trim();
  if (trimmed.startsWith("@") && trimmed.length > 1) {
    return trimmed.slice(1);
  }
  return undefined;
};

export interface UserFingerprints {
  emails: string[];
  githubAccountIds: string[];
  githubLoginLookups: string[];
  githubLogins: string[];
  hasChatgpt: boolean;
  hasGithub: boolean;
  personKeys: string[];
}

export const fingerprintsFor = (
  user: Pick<Doc<"users">, "email" | "name">,
  connections: Pick<
    Doc<"connections">,
    "accountId" | "identity" | "provider"
  >[],
  workspace: Pick<Doc<"workspaces">, "githubOwner"> | null
): UserFingerprints => {
  const emails = new Set<string>();
  const githubAccountIds = new Set<string>();
  const githubLoginLookups = new Set<string>();
  const githubLogins = new Set<string>();
  const personKeys = new Set<string>();
  const rememberGithubLogin = (login: string) => {
    githubLogins.add(login.toLowerCase());
    githubLoginLookups.add(login);
    githubLoginLookups.add(login.toLowerCase());
  };
  if (user.email) {
    emails.add(user.email.toLowerCase());
  }
  if (user.name) {
    personKeys.add(normalizePersonKey(user.name));
  }
  if (workspace?.githubOwner) {
    rememberGithubLogin(workspace.githubOwner);
    personKeys.add(normalizePersonKey(workspace.githubOwner));
  }
  let hasChatgpt = false;
  let hasGithub = false;
  for (const row of connections) {
    if (row.provider === "chatgpt") {
      hasChatgpt = true;
    }
    if (row.provider === "github") {
      hasGithub = true;
      githubAccountIds.add(row.accountId);
    }
    const login = githubLoginFromIdentity(row.identity);
    if (login) {
      rememberGithubLogin(login);
      personKeys.add(normalizePersonKey(login));
    }
    if (looksLikeEmail(row.identity)) {
      emails.add(row.identity.toLowerCase());
    }
    personKeys.add(normalizePersonKey(row.identity));
  }
  return {
    emails: [...emails],
    githubAccountIds: [...githubAccountIds],
    githubLoginLookups: [...githubLoginLookups],
    githubLogins: [...githubLogins],
    hasChatgpt,
    hasGithub,
    personKeys: [...personKeys].filter((item) => item.length > 2),
  };
};

const shares = (left: string[], right: string[]): boolean => {
  const rightSet = new Set(right);
  return left.some((item) => rightSet.has(item));
};

export const shouldMergeUsers = (
  left: UserFingerprints,
  right: UserFingerprints
): boolean => {
  if (
    left.githubAccountIds.length > 0 &&
    right.githubAccountIds.length > 0 &&
    !shares(left.githubAccountIds, right.githubAccountIds)
  ) {
    return false;
  }
  if (shares(left.emails, right.emails)) {
    return true;
  }
  if (shares(left.githubLogins, right.githubLogins)) {
    return true;
  }
  const complementary =
    (left.hasGithub &&
      !left.hasChatgpt &&
      right.hasChatgpt &&
      !right.hasGithub) ||
    (right.hasGithub &&
      !right.hasChatgpt &&
      left.hasChatgpt &&
      !left.hasGithub);
  return complementary && shares(left.personKeys, right.personKeys);
};
