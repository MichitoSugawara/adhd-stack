import { getAuthUserId } from "@convex-dev/auth/server";

import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AuthCtx = MutationCtx | QueryCtx;

export const getCurrentUserOrNull = async (
  ctx: AuthCtx
): Promise<Doc<"users"> | null> => {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    return null;
  }
  return await ctx.db.get(userId);
};

export const getCurrentUser = async (ctx: AuthCtx): Promise<Doc<"users">> => {
  const user = await getCurrentUserOrNull(ctx);
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
};

export const requireUserId = async (ctx: AuthCtx): Promise<Id<"users">> => {
  const user = await getCurrentUser(ctx);
  return user._id;
};
