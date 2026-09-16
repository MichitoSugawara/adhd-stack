import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { fingerprintsFor, shouldMergeUsers } from "./accountMatch";
import { slugFromName } from "./appSlug";
import type { ProviderId } from "./providers";

type DbCtx = MutationCtx | QueryCtx;

export interface TicketSnapshot {
  accountKey: string;
  backend?: "custom" | "openconnector";
  connectionAccountId?: string;
  email?: string;
  identity: string;
  name?: string;
  oc?: {
    connectedAccountId?: string;
    connectionName: string;
    displayLabel?: string;
    service: string;
  };
  pendingProvider: ProviderId;
  planWarning?: string;
  tokens?: {
    accessToken: string;
    expiresAt?: number;
    refreshToken?: string;
  };
}

export const readLiveTicket = async (
  ctx: DbCtx,
  ticket: string,
  now: number
): Promise<TicketSnapshot | null> => {
  const row = await ctx.db
    .query("oauthTickets")
    .withIndex("by_ticket", (q) => q.eq("ticket", ticket))
    .unique();
  if (!row || row.consumed || row.expiresAt <= now) {
    return null;
  }
  return {
    accountKey: row.accountKey,
    backend: row.backend,
    connectionAccountId: row.connectionAccountId,
    email: row.email,
    identity: row.identity,
    name: row.name,
    oc: row.oc,
    pendingProvider: row.pendingProvider,
    planWarning: row.planWarning,
    tokens: row.tokens,
  };
};

const uniqueUserId = (rows: { userId: Id<"users"> }[]): Id<"users"> | null => {
  const ids = new Set(rows.map((row) => row.userId));
  if (ids.size !== 1) {
    return null;
  }
  return rows[0]?.userId ?? null;
};

export const findExistingUserIdForTicket = async (
  ctx: DbCtx,
  args: {
    accountId: string;
    accountKey: string;
    email?: string;
  }
): Promise<Id<"users"> | null> => {
  const existingAccount = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", "ticket").eq("providerAccountId", args.accountKey)
    )
    .unique();
  if (existingAccount) {
    return existingAccount.userId;
  }
  const accountIds = [...new Set([args.accountId, args.accountKey])];
  for (const accountId of accountIds) {
    const connections = await ctx.db
      .query("connections")
      .withIndex("by_account_id", (q) => q.eq("accountId", accountId))
      .take(4);
    const userId = uniqueUserId(connections);
    if (userId) {
      return userId;
    }
    const connectors = await ctx.db
      .query("connectorConnections")
      .withIndex("by_connected_account", (q) =>
        q.eq("connectedAccountId", accountId)
      )
      .take(4);
    const connectorUserId = uniqueUserId(connectors);
    if (connectorUserId) {
      return connectorUserId;
    }
  }
  if (!args.email) {
    return null;
  }
  const emails = [...new Set([args.email, args.email.toLowerCase()])];
  for (const email of emails) {
    const matches = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .take(2);
    const [match] = matches;
    if (matches.length === 1 && match) {
      return match._id;
    }
  }
  return null;
};

export const linkTicketAccountFor = async (
  ctx: MutationCtx,
  args: { accountKey: string; userId: Id<"users"> }
): Promise<void> => {
  const existing = await ctx.db
    .query("authAccounts")
    .withIndex("providerAndAccountId", (q) =>
      q.eq("provider", "ticket").eq("providerAccountId", args.accountKey)
    )
    .unique();
  if (existing) {
    if (existing.userId !== args.userId) {
      await ctx.db.patch(existing._id, { userId: args.userId });
    }
    return;
  }
  await ctx.db.insert("authAccounts", {
    provider: "ticket",
    providerAccountId: args.accountKey,
    userId: args.userId,
  });
};

export const finalizeTicketForUser = async (
  ctx: MutationCtx,
  args: { ticket: string; userId: Id<"users"> }
): Promise<void> => {
  const row = await ctx.db
    .query("oauthTickets")
    .withIndex("by_ticket", (q) => q.eq("ticket", args.ticket))
    .unique();
  if (!row || row.consumed) {
    throw new Error("Sign-in ticket is invalid");
  }
  await ctx.db.patch(row._id, { consumed: true });
  if (row.backend === "openconnector" && row.oc) {
    const existing = await ctx.db
      .query("connectorConnections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.userId).eq("provider", row.pendingProvider)
      )
      .unique();
    const payload = {
      backend: "openconnector" as const,
      connectedAccountId:
        row.oc.connectedAccountId ?? row.connectionAccountId ?? row.accountKey,
      connectedAt: Date.now(),
      connectionName: row.oc.connectionName,
      displayLabel: row.oc.displayLabel ?? row.identity,
      lastCheckedAt: Date.now(),
      provider: row.pendingProvider,
      status: "connected" as const,
      userId: args.userId,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return;
    }
    await ctx.db.insert("connectorConnections", payload);
    return;
  }
  if (!row.tokens) {
    throw new Error("Sign-in ticket is invalid");
  }
  const existing = await ctx.db
    .query("connections")
    .withIndex("by_user_and_provider", (q) =>
      q.eq("userId", args.userId).eq("provider", row.pendingProvider)
    )
    .unique();
  const payload = {
    accessToken: row.tokens.accessToken,
    accountId: row.connectionAccountId ?? row.accountKey,
    connectedAt: Date.now(),
    expiresAt: row.tokens.expiresAt,
    identity: row.identity,
    planWarning: row.planWarning,
    provider: row.pendingProvider,
    refreshToken: row.tokens.refreshToken,
    status: "connected" as const,
    userId: args.userId,
  };
  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return;
  }
  await ctx.db.insert("connections", payload);
};

export const rememberEmailForUser = async (
  ctx: MutationCtx,
  args: {
    email?: string;
    name?: string;
    userId: Id<"users">;
  }
): Promise<void> => {
  const user = await ctx.db.get(args.userId);
  if (!user) {
    return;
  }
  const patch: {
    email?: string;
    emailVerificationTime?: number;
    name?: string;
  } = {};
  if (args.email) {
    if (!user.email) {
      patch.email = args.email;
      patch.emailVerificationTime = Date.now();
    } else if (
      user.email.toLowerCase() === args.email.toLowerCase() &&
      user.emailVerificationTime === undefined
    ) {
      patch.emailVerificationTime = Date.now();
    }
  }
  if (args.name && !user.name) {
    patch.name = args.name;
  }
  if (Object.keys(patch).length > 0) {
    await ctx.db.patch(user._id, patch);
  }
};

export const attachTicketToUser = async (
  ctx: MutationCtx,
  args: { now: number; ticket: string; userId: Id<"users"> }
): Promise<TicketSnapshot> => {
  const pending = await readLiveTicket(ctx, args.ticket, args.now);
  if (!pending) {
    throw new Error("チケットが無効です。もう一度接続してください");
  }
  await linkTicketAccountFor(ctx, {
    accountKey: pending.accountKey,
    userId: args.userId,
  });
  await finalizeTicketForUser(ctx, {
    ticket: args.ticket,
    userId: args.userId,
  });
  await rememberEmailForUser(ctx, {
    email: pending.email,
    name: pending.name,
    userId: args.userId,
  });
  return pending;
};

const loadFingerprints = async (ctx: DbCtx, userId: Id<"users">) => {
  const [user, connections, workspaces, connectors] = await Promise.all([
    ctx.db.get(userId),
    ctx.db
      .query("connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20),
    ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(20),
    ctx.db
      .query("connectorConnections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(8),
  ]);
  if (!user) {
    return null;
  }
  const workspace =
    workspaces.find((row) => row.githubOwner) ?? workspaces[0] ?? null;
  const synthetic: Pick<
    Doc<"connections">,
    "accountId" | "identity" | "provider"
  >[] = [];
  for (const row of connectors) {
    if (row.status !== "connected") {
      continue;
    }
    synthetic.push({
      accountId: row.connectedAccountId,
      identity: row.displayLabel,
      provider: row.provider,
    });
  }
  return fingerprintsFor(user, [...connections, ...synthetic], workspace);
};

const addCandidate = (
  ids: Set<Id<"users">>,
  userId: Id<"users">,
  excludeUserId: Id<"users"> | null
) => {
  if (userId !== excludeUserId) {
    ids.add(userId);
  }
};

export const collectMergeCandidates = async (
  ctx: DbCtx,
  mine: ReturnType<typeof fingerprintsFor>,
  excludeUserId: Id<"users"> | null
): Promise<Id<"users">[]> => {
  const candidateIds = new Set<Id<"users">>();
  for (const email of mine.emails) {
    const byEmail = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .take(4);
    for (const user of byEmail) {
      addCandidate(candidateIds, user._id, excludeUserId);
    }
  }
  for (const login of mine.githubLoginLookups) {
    const byIdentity = await ctx.db
      .query("connections")
      .withIndex("by_identity", (q) => q.eq("identity", `@${login}`))
      .take(4);
    for (const row of byIdentity) {
      addCandidate(candidateIds, row.userId, excludeUserId);
    }
    const byOwner = await ctx.db
      .query("workspaces")
      .withIndex("by_github_owner", (q) => q.eq("githubOwner", login))
      .take(4);
    for (const workspace of byOwner) {
      addCandidate(candidateIds, workspace.userId, excludeUserId);
    }
  }
  for (const accountId of mine.githubAccountIds) {
    const byAccount = await ctx.db
      .query("connections")
      .withIndex("by_account_id", (q) => q.eq("accountId", accountId))
      .take(4);
    for (const row of byAccount) {
      addCandidate(candidateIds, row.userId, excludeUserId);
    }
  }
  if (candidateIds.size === 0) {
    const githubRows = await ctx.db
      .query("connections")
      .withIndex("by_provider", (q) => q.eq("provider", "github"))
      .take(40);
    const chatgptRows = await ctx.db
      .query("connections")
      .withIndex("by_provider", (q) => q.eq("provider", "chatgpt"))
      .take(40);
    for (const row of [...githubRows, ...chatgptRows]) {
      addCandidate(candidateIds, row.userId, excludeUserId);
    }
  }
  return [...candidateIds];
};

export const findMatchingUserIdFromPrints = async (
  ctx: DbCtx,
  mine: ReturnType<typeof fingerprintsFor>,
  excludeUserId: Id<"users"> | null
): Promise<Id<"users"> | null> => {
  const candidateIds = await collectMergeCandidates(ctx, mine, excludeUserId);
  for (const candidateId of candidateIds) {
    const theirs = await loadFingerprints(ctx, candidateId);
    if (theirs && shouldMergeUsers(mine, theirs)) {
      return candidateId;
    }
  }
  return null;
};

export const findMatchingUserId = async (
  ctx: DbCtx,
  userId: Id<"users">
): Promise<Id<"users"> | null> => {
  const mine = await loadFingerprints(ctx, userId);
  if (!mine) {
    return null;
  }
  return await findMatchingUserIdFromPrints(ctx, mine, userId);
};

export const findMatchingUserIdForTicket = async (
  ctx: DbCtx,
  ticket: Pick<
    TicketSnapshot,
    | "connectionAccountId"
    | "accountKey"
    | "email"
    | "identity"
    | "name"
    | "pendingProvider"
  >
): Promise<Id<"users"> | null> => {
  const mine = fingerprintsFor(
    { email: ticket.email, name: ticket.name },
    [
      {
        accountId: ticket.connectionAccountId ?? ticket.accountKey,
        identity: ticket.identity,
        provider: ticket.pendingProvider,
      },
    ],
    null
  );
  return await findMatchingUserIdFromPrints(ctx, mine, null);
};

const preferText = (keep?: string, absorb?: string): string | undefined =>
  keep || absorb;

const pickProvisionStatus = <T extends string>(keep: T, absorb: T): T => {
  if (keep === "ready") {
    return keep;
  }
  if (absorb === "ready") {
    return absorb;
  }
  return keep;
};

export const mergeUserPair = async (
  ctx: MutationCtx,
  args: { absorbUserId: Id<"users">; keepUserId: Id<"users"> }
): Promise<void> => {
  if (args.keepUserId === args.absorbUserId) {
    return;
  }
  const [keep, absorb] = await Promise.all([
    ctx.db.get(args.keepUserId),
    ctx.db.get(args.absorbUserId),
  ]);
  if (!(keep && absorb)) {
    throw new Error("User not found");
  }

  const absorbConnections = await ctx.db
    .query("connections")
    .withIndex("by_user", (q) => q.eq("userId", args.absorbUserId))
    .take(20);
  for (const row of absorbConnections) {
    const existing = await ctx.db
      .query("connections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.keepUserId).eq("provider", row.provider)
      )
      .unique();
    if (!existing) {
      await ctx.db.patch(row._id, { userId: args.keepUserId });
      continue;
    }
    const keepLive =
      existing.status === "connected" && existing.accessToken.length > 0;
    if (!keepLive) {
      await ctx.db.patch(existing._id, {
        accessToken: row.accessToken,
        accountId: row.accountId,
        connectedAt: row.connectedAt,
        expiresAt: row.expiresAt,
        identity: row.identity,
        planWarning: row.planWarning,
        refreshToken: row.refreshToken,
        status: row.status,
      });
    }
    await ctx.db.delete(row._id);
  }

  const absorbConnectors = await ctx.db
    .query("connectorConnections")
    .withIndex("by_user", (q) => q.eq("userId", args.absorbUserId))
    .take(8);
  for (const row of absorbConnectors) {
    const existing = await ctx.db
      .query("connectorConnections")
      .withIndex("by_user_and_provider", (q) =>
        q.eq("userId", args.keepUserId).eq("provider", row.provider)
      )
      .unique();
    if (!existing) {
      await ctx.db.patch(row._id, { userId: args.keepUserId });
      continue;
    }
    if (existing.status !== "connected" && row.status === "connected") {
      await ctx.db.patch(existing._id, {
        connectedAccountId: row.connectedAccountId,
        connectedAt: row.connectedAt,
        connectionName: row.connectionName,
        displayLabel: row.displayLabel,
        lastCheckedAt: row.lastCheckedAt,
        status: row.status,
      });
    }
    await ctx.db.delete(row._id);
  }

  const [keepWorkspaces, absorbWorkspaces] = await Promise.all([
    ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", args.keepUserId))
      .take(50),
    ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", args.absorbUserId))
      .take(50),
  ]);
  const keepBySlug = new Map(
    keepWorkspaces.map((row) => [row.slug ?? slugFromName(row.name), row])
  );
  for (const absorbWorkspace of absorbWorkspaces) {
    const slug = absorbWorkspace.slug ?? slugFromName(absorbWorkspace.name);
    const keepWorkspace = keepBySlug.get(slug);
    if (!keepWorkspace) {
      await ctx.db.patch(absorbWorkspace._id, { userId: args.keepUserId });
      continue;
    }
    await ctx.db.patch(keepWorkspace._id, {
      cloudflareAccountId: preferText(
        keepWorkspace.cloudflareAccountId,
        absorbWorkspace.cloudflareAccountId
      ),
      cloudflarePagesUrl: preferText(
        keepWorkspace.cloudflarePagesUrl,
        absorbWorkspace.cloudflarePagesUrl
      ),
      cloudflarePreviewUrl: preferText(
        keepWorkspace.cloudflarePreviewUrl,
        absorbWorkspace.cloudflarePreviewUrl
      ),
      cloudflareProjectName: preferText(
        keepWorkspace.cloudflareProjectName,
        absorbWorkspace.cloudflareProjectName
      ),
      codexEnvironmentId: preferText(
        keepWorkspace.codexEnvironmentId,
        absorbWorkspace.codexEnvironmentId
      ),
      codingBackend:
        keepWorkspace.codingBackend ?? absorbWorkspace.codingBackend,
      codingEnvironmentId: preferText(
        keepWorkspace.codingEnvironmentId,
        absorbWorkspace.codingEnvironmentId
      ),
      convexDeploymentName: preferText(
        keepWorkspace.convexDeploymentName,
        absorbWorkspace.convexDeploymentName
      ),
      convexProjectSlug: preferText(
        keepWorkspace.convexProjectSlug,
        absorbWorkspace.convexProjectSlug
      ),
      convexTeamSlug: preferText(
        keepWorkspace.convexTeamSlug,
        absorbWorkspace.convexTeamSlug
      ),
      convexUrl: preferText(keepWorkspace.convexUrl, absorbWorkspace.convexUrl),
      githubOwner: preferText(
        keepWorkspace.githubOwner,
        absorbWorkspace.githubOwner
      ),
      githubRepoFullName: preferText(
        keepWorkspace.githubRepoFullName,
        absorbWorkspace.githubRepoFullName
      ),
      githubRepoId: keepWorkspace.githubRepoId ?? absorbWorkspace.githubRepoId,
      githubRepoName: preferText(
        keepWorkspace.githubRepoName,
        absorbWorkspace.githubRepoName
      ),
      githubRepoUrl: preferText(
        keepWorkspace.githubRepoUrl,
        absorbWorkspace.githubRepoUrl
      ),
      originRepoUrl: preferText(
        keepWorkspace.originRepoUrl,
        absorbWorkspace.originRepoUrl
      ),
      pagesDeployId: preferText(
        keepWorkspace.pagesDeployId,
        absorbWorkspace.pagesDeployId
      ),
      pagesDeployStatus:
        keepWorkspace.pagesDeployStatus ?? absorbWorkspace.pagesDeployStatus,
      provisionError: keepWorkspace.provisionError,
      provisionStatus: pickProvisionStatus(
        keepWorkspace.provisionStatus,
        absorbWorkspace.provisionStatus
      ),
      publishError: preferText(
        keepWorkspace.publishError,
        absorbWorkspace.publishError
      ),
      publishNotes:
        keepWorkspace.publishNotes && keepWorkspace.publishNotes.length > 0
          ? keepWorkspace.publishNotes
          : absorbWorkspace.publishNotes,
      slug: keepWorkspace.slug ?? absorbWorkspace.slug ?? slug,
      updatedAt: Date.now(),
    });
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_workspace_and_created", (q) =>
        q.eq("workspaceId", absorbWorkspace._id)
      )
      .take(200);
    for (const message of messages) {
      await ctx.db.patch(message._id, { workspaceId: keepWorkspace._id });
    }
    await ctx.db.delete(absorbWorkspace._id);
  }

  const absorbAccounts = await ctx.db
    .query("authAccounts")
    .withIndex("userIdAndProvider", (q) => q.eq("userId", args.absorbUserId))
    .take(20);
  for (const account of absorbAccounts) {
    const clash = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q
          .eq("provider", account.provider)
          .eq("providerAccountId", account.providerAccountId)
      )
      .unique();
    if (clash && clash._id !== account._id) {
      await ctx.db.delete(account._id);
      continue;
    }
    await ctx.db.patch(account._id, { userId: args.keepUserId });
  }

  const sessions = await ctx.db
    .query("authSessions")
    .withIndex("userId", (q) => q.eq("userId", args.absorbUserId))
    .take(20);
  for (const session of sessions) {
    await ctx.db.delete(session._id);
  }

  await ctx.db.patch(args.absorbUserId, {
    email: undefined,
    emailVerificationTime: undefined,
  });
  if (!keep.email && absorb.email) {
    await ctx.db.patch(args.keepUserId, {
      email: absorb.email,
      emailVerificationTime: absorb.emailVerificationTime ?? Date.now(),
      name: keep.name ?? absorb.name,
    });
  }
};

export const mergeCurrentUserDuplicates = async (
  ctx: MutationCtx,
  user: Pick<Doc<"users">, "_id">
): Promise<boolean> => {
  const otherId = await findMatchingUserId(ctx, user._id);
  if (!otherId) {
    return false;
  }
  await mergeUserPair(ctx, {
    absorbUserId: otherId,
    keepUserId: user._id,
  });
  return true;
};
