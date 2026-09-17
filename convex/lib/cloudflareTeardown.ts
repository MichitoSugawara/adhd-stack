import type { CascadeResourceResult } from "./cascadeDeleteResult";
import { getCloudflareAccountId } from "./cloudflarePages";
import { asList, asRecord, asString, readJson } from "./httpJson";
import { reconnectMessage } from "./tokenRefresh";

const pagesFail = (detail?: string): CascadeResourceResult => ({
  kind: "cloudflare_pages",
  message:
    detail && detail.length > 0
      ? `公開ページを消せませんでした。${detail}`
      : "公開ページを消せませんでした。つなぎ直してから、もう一度試してください",
  reconnect: true,
  status: "failed",
});

export const deletePagesProject = async (args: {
  accountId?: string;
  projectName: string;
  token: string | null;
}): Promise<CascadeResourceResult> => {
  if (!args.token) {
    return {
      kind: "cloudflare_pages",
      message: reconnectMessage("cloudflare"),
      reconnect: true,
      status: "failed",
    };
  }
  let { accountId } = args;
  try {
    accountId ??= await getCloudflareAccountId(args.token, args.accountId);
  } catch (error) {
    return pagesFail(error instanceof Error ? error.message : undefined);
  }
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(args.projectName)}`,
    {
      headers: {
        Authorization: `Bearer ${args.token}`,
        "Content-Type": "application/json",
      },
      method: "DELETE",
    }
  );
  if (response.ok || response.status === 200) {
    return {
      kind: "cloudflare_pages",
      message: "公開ページを消しました",
      reconnect: false,
      status: "deleted",
    };
  }
  if (response.status === 404) {
    return {
      kind: "cloudflare_pages",
      message: "公開ページはすでにありませんでした",
      reconnect: false,
      status: "already_gone",
    };
  }
  const payload = await readJson(response);
  const errorMessage = asList(payload.errors)
    .map((item) => asString(asRecord(item).message))
    .find((item): item is string => item !== undefined);
  return pagesFail(
    errorMessage ??
      asString(payload.message) ??
      `HTTP ${String(response.status)}`
  );
};
