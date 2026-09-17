import type { CascadeKind, CascadeRemoteKind } from "./cascadeDeletePlan";

export const cascadeResourceStatuses = [
  "already_gone",
  "blocked",
  "deleted",
  "failed",
  "skipped",
  "unsupported",
] as const;

export type CascadeResourceStatus = (typeof cascadeResourceStatuses)[number];

export interface CascadeResourceResult {
  kind: CascadeKind;
  message: string;
  reconnect: boolean;
  status: CascadeResourceStatus;
}

export interface CascadeDeleteResult {
  complete: boolean;
  localDeleted: boolean;
  resources: CascadeResourceResult[];
}

export const REMOTE_SUCCESS_STATUSES = new Set<CascadeResourceStatus>([
  "already_gone",
  "deleted",
  "skipped",
  "unsupported",
]);

export const shouldDeleteLocalRecords = (
  remotes: readonly CascadeResourceResult[]
): boolean => remotes.every((row) => row.status !== "failed");

export const summarizeCascadeResults = (
  resources: readonly CascadeResourceResult[]
): Pick<CascadeDeleteResult, "complete" | "localDeleted"> => {
  const local = resources.find((row) => row.kind === "local_records");
  const localDeleted =
    local?.status === "deleted" || local?.status === "already_gone";
  const remotesHonest = resources
    .filter(
      (row): row is CascadeResourceResult & { kind: CascadeRemoteKind } =>
        row.kind !== "local_records"
    )
    .every((row) => REMOTE_SUCCESS_STATUSES.has(row.status));
  return {
    complete: remotesHonest && localDeleted === true,
    localDeleted: localDeleted === true,
  };
};

export const cascadeResultFrom = (
  resources: readonly CascadeResourceResult[]
): CascadeDeleteResult => ({
  ...summarizeCascadeResults(resources),
  resources: [...resources],
});
