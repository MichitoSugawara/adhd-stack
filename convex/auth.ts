import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { convexAuth, createAccount } from "@convex-dev/auth/server";

import { internal } from "./_generated/api";

export const { auth, isAuthenticated, signIn, signOut, store } = convexAuth({
  providers: [
    ConvexCredentials({
      authorize: async (credentials, ctx) => {
        const ticketValue = credentials.ticket;
        if (typeof ticketValue !== "string" || ticketValue.length === 0) {
          return null;
        }
        const ticket = await ctx.runQuery(internal.oauthInternal.getTicket, {
          now: Date.now(),
          ticket: ticketValue,
        });
        if (!ticket) {
          return null;
        }
        const existingUserId =
          (await ctx.runQuery(
            internal.oauthInternal.findExistingUserForTicket,
            {
              accountId: ticket.connectionAccountId ?? ticket.accountKey,
              accountKey: ticket.accountKey,
              email: ticket.email,
            }
          )) ??
          (await ctx.runQuery(
            internal.oauthInternal.findMatchingUserForTicket,
            {
              accountKey: ticket.accountKey,
              connectionAccountId: ticket.connectionAccountId,
              email: ticket.email,
              identity: ticket.identity,
              name: ticket.name,
              pendingProvider: ticket.pendingProvider,
            }
          ));
        if (existingUserId) {
          await ctx.runMutation(internal.oauthInternal.linkTicketAccount, {
            accountKey: ticket.accountKey,
            userId: existingUserId,
          });
          await ctx.runMutation(internal.oauthInternal.finalizeTicket, {
            ticket: ticketValue,
            userId: existingUserId,
          });
          await ctx.runMutation(internal.oauthStore.rememberUserEmail, {
            email: ticket.email,
            name: ticket.name,
            userId: existingUserId,
          });
          return { userId: existingUserId };
        }
        const profile: {
          email?: string;
          emailVerified?: boolean;
          name?: string;
        } = {};
        if (ticket.email) {
          profile.email = ticket.email;
          profile.emailVerified = true;
        }
        if (ticket.name) {
          profile.name = ticket.name;
        }
        const { user } = await createAccount(ctx, {
          account: { id: ticket.accountKey },
          profile,
          provider: "ticket",
          shouldLinkViaEmail: Boolean(ticket.email),
        });
        await ctx.runMutation(internal.oauthInternal.finalizeTicket, {
          ticket: ticketValue,
          userId: user._id,
        });
        return { userId: user._id };
      },
      id: "ticket",
    }),
  ],
});
