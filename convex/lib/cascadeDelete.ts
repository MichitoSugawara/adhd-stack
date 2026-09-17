import type { ConnectorOrToken } from "./actionAuth";
import type {
  CascadePlanItem,
  CascadeWorkspaceSnapshot,
} from "./cascadeDeletePlan";
import { planCascadeDelete } from "./cascadeDeletePlan";
import type {
  CascadeDeleteResult,
  CascadeResourceResult,
} from "./cascadeDeleteResult";
import {
  cascadeResultFrom,
  shouldDeleteLocalRecords,
} from "./cascadeDeleteResult";
import { deletePagesProject } from "./cloudflareTeardown";
import { deleteCodexEnvironment, resolveCodexAccountId } from "./codexCloud";
import { deleteConvexProject } from "./convexTeardown";
import { deleteGitHubRepo } from "./githubTeardown";
import { reconnectMessage } from "./tokenRefresh";
import type { StoredConnectionSecret } from "./tokenRefresh";

export interface CascadeDeleteDeps {
  deleteLocal: () => Promise<boolean>;
  loadChatgpt: () => Promise<StoredConnectionSecret | null>;
  loadCloudflare: () => Promise<StoredConnectionSecret | null>;
  loadConvex: () => Promise<ConnectorOrToken | null>;
  loadGithub: () => Promise<ConnectorOrToken | null>;
}

const plannedResult = (item: CascadePlanItem): CascadeResourceResult => ({
  kind: item.kind,
  message: item.message,
  reconnect: false,
  status: item.decision === "block" ? "blocked" : "skipped",
});

const deleteCodexPlanned = async (
  item: CascadePlanItem,
  loadChatgpt: CascadeDeleteDeps["loadChatgpt"]
): Promise<CascadeResourceResult> => {
  if (!item.environmentId) {
    return plannedResult({
      ...item,
      decision: "skip",
      message: "実行環境はまだありません",
    });
  }
  const secret = await loadChatgpt();
  if (!secret) {
    return {
      kind: "codex_environment",
      message: reconnectMessage("chatgpt"),
      reconnect: true,
      status: "failed",
    };
  }
  const accountId = await resolveCodexAccountId(
    secret.accessToken,
    secret.accountId
  );
  const outcome = await deleteCodexEnvironment(
    { accessToken: secret.accessToken, accountId },
    item.environmentId
  );
  if (outcome.outcome === "deleted") {
    return {
      kind: "codex_environment",
      message: "実行環境を消しました",
      reconnect: false,
      status: "deleted",
    };
  }
  if (outcome.outcome === "already_gone") {
    return {
      kind: "codex_environment",
      message: "実行環境はすでにありませんでした",
      reconnect: false,
      status: "already_gone",
    };
  }
  if (outcome.outcome === "unsupported") {
    return {
      kind: "codex_environment",
      message: "実行環境の削除 API が使えないため、残っている可能性があります",
      reconnect: false,
      status: "unsupported",
    };
  }
  return {
    kind: "codex_environment",
    message:
      outcome.detail.length > 0
        ? `実行環境を消せませんでした。${outcome.detail}`
        : reconnectMessage("chatgpt"),
    reconnect: true,
    status: "failed",
  };
};

const executePlanned = async (
  item: CascadePlanItem,
  deps: CascadeDeleteDeps
): Promise<CascadeResourceResult> => {
  if (item.decision !== "delete") {
    return plannedResult(item);
  }
  if (item.kind === "codex_environment") {
    return await deleteCodexPlanned(item, deps.loadChatgpt);
  }
  if (item.kind === "cloudflare_pages" && item.pages) {
    const secret = await deps.loadCloudflare();
    return await deletePagesProject({
      accountId: item.pages.accountId,
      projectName: item.pages.projectName,
      token: secret?.accessToken ?? null,
    });
  }
  if (item.kind === "github_repo" && item.github) {
    return await deleteGitHubRepo({
      auth: await deps.loadGithub(),
      owner: item.github.owner,
      repo: item.github.repo,
    });
  }
  if (item.kind === "convex_project" && item.convex) {
    return await deleteConvexProject({
      auth: await deps.loadConvex(),
      projectSlug: item.convex.projectSlug,
      teamSlug: item.convex.teamSlug,
    });
  }
  return plannedResult({
    ...item,
    decision: "skip",
    message: "対象の記録が足りないので、消しません",
  });
};

const localResult = async (
  remotes: readonly CascadeResourceResult[],
  deleteLocal: CascadeDeleteDeps["deleteLocal"]
): Promise<CascadeResourceResult> => {
  if (!shouldDeleteLocalRecords(remotes)) {
    return {
      kind: "local_records",
      message:
        "つながっているものを消せなかったので、この画面の記録は残しています。つなぎ直してから、もう一度削除してください",
      reconnect: remotes.some((row) => row.reconnect),
      status: "skipped",
    };
  }
  const deleted = await deleteLocal();
  return {
    kind: "local_records",
    message: deleted
      ? "この画面の記録を消しました"
      : "この画面の記録はすでにありませんでした",
    reconnect: false,
    status: deleted ? "deleted" : "already_gone",
  };
};

export const runCascadeDelete = async (
  workspace: CascadeWorkspaceSnapshot,
  deps: CascadeDeleteDeps
): Promise<CascadeDeleteResult> => {
  const remotes: CascadeResourceResult[] = [];
  for (const item of planCascadeDelete(workspace)) {
    remotes.push(await executePlanned(item, deps));
  }
  const resources = [...remotes, await localResult(remotes, deps.deleteLocal)];
  return cascadeResultFrom(resources);
};
