import { v } from "convex/values";

import { internalMutation, internalQuery } from "./_generated/server";
import {
  findExistingUserIdForTicket,
  findMatchingUserId,
  findMatchingUserIdForTicket,
  finalizeTicketForUser,
  linkTicketAccountFor,
  mergeUserPair,
  readLiveTicket,
} from "./lib/accountLinking";
import {
  providerValidator,
  ticketBackendValidator,
  ticketOcValidator,
  ticketTokensValidator,
} from "./validators";

const ticketDocValidator = v.object({
  accountKey: v.string(),
  backend: v.optional(ticketBackendValidator),
  connectionAccountId: v.optional(v.string()),
  email: v.optional(v.string()),
  identity: v.string(),
  name: v.optional(v.string()),
  oc: v.optional(ticketOcValidator),
  pendingProvider: providerValidator,
  planWarning: v.optional(v.string()),
  tokens: v.optional(ticketTokensValidator),
});

export const getTicket = internalQuery({
  args: {
    now: v.number(),
    ticket: v.string(),
  },
  handler: async (ctx, args) =>
    await readLiveTicket(ctx, args.ticket, args.now),
  returns: v.union(ticketDocValidator, v.null()),
});

export const findExistingUserForTicket = internalQuery({
  args: {
    accountId: v.optional(v.string()),
    accountKey: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    await findExistingUserIdForTicket(ctx, {
      accountId: args.accountId ?? args.accountKey,
      accountKey: args.accountKey,
      email: args.email,
    }),
  returns: v.union(v.id("users"), v.null()),
});

export const findMatchingUserForTicket = internalQuery({
  args: {
    accountKey: v.string(),
    connectionAccountId: v.optional(v.string()),
    email: v.optional(v.string()),
    identity: v.string(),
    name: v.optional(v.string()),
    pendingProvider: providerValidator,
  },
  handler: async (ctx, args) => await findMatchingUserIdForTicket(ctx, args),
  returns: v.union(v.id("users"), v.null()),
});

export const linkTicketAccount = internalMutation({
  args: {
    accountKey: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await linkTicketAccountFor(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const finalizeTicket = internalMutation({
  args: {
    ticket: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await finalizeTicketForUser(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const mergeUsers = internalMutation({
  args: {
    absorbUserId: v.id("users"),
    keepUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await mergeUserPair(ctx, args);
    return null;
  },
  returns: v.null(),
});

export const findMatchingUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => await findMatchingUserId(ctx, args.userId),
  returns: v.union(v.id("users"), v.null()),
});
