import { v } from "convex/values";

import {
  attachTicketToUser,
  mergeCurrentUserDuplicates,
} from "./lib/accountLinking";
import { authedMutation } from "./lib/customFunctions";

export const attachTicket = authedMutation({
  args: { ticket: v.string() },
  handler: async (ctx, args) => {
    await attachTicketToUser(ctx, {
      now: Date.now(),
      ticket: args.ticket,
      userId: ctx.user._id,
    });
    return null;
  },
  returns: v.null(),
});

export const mergeMyDuplicates = authedMutation({
  args: {},
  handler: async (ctx) => {
    const merged = await mergeCurrentUserDuplicates(ctx, ctx.user);
    return { merged };
  },
  returns: v.object({ merged: v.boolean() }),
});
