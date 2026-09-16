import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { isOpenConnectorService } from "./openConnector";
import { PROVIDER_IDS } from "./providers";
import { canKeepConnection } from "./tokenRefresh";

type DbCtx = MutationCtx | QueryCtx;

export const userHasAllConnections = async (
  ctx: DbCtx,
  userId: Id<"users">,
  now: number
): Promise<boolean> => {
  const [customRows, connectorRows] = await Promise.all([
    ctx.db
      .query("connections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(8),
    ctx.db
      .query("connectorConnections")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .take(8),
  ]);
  const customByProvider = new Map(
    customRows.map((row) => [row.provider, row])
  );
  const connectorByProvider = new Map(
    connectorRows.map((row) => [row.provider, row])
  );
  return PROVIDER_IDS.every((provider) => {
    if (isOpenConnectorService(provider)) {
      const row = connectorByProvider.get(provider);
      if (row?.status === "connected" && row.connectedAccountId.length > 0) {
        return true;
      }
      const legacy = customByProvider.get(provider);
      return Boolean(
        legacy &&
        canKeepConnection(
          {
            accessToken: legacy.accessToken,
            expiresAt: legacy.expiresAt,
            refreshToken: legacy.refreshToken,
            status: legacy.status,
          },
          now
        )
      );
    }
    const row = customByProvider.get(provider);
    if (!row) {
      return false;
    }
    return canKeepConnection(
      {
        accessToken: row.accessToken,
        expiresAt: row.expiresAt,
        refreshToken: row.refreshToken,
        status: row.status,
      },
      now
    );
  });
};
