import type { NormalizedTurn } from "./codingEvents";

export type CodingBackendKind = "codex_cloud" | "cursor_cloud";

export type CodingStatus = "error" | "idle" | "running";

export interface CodingProvisionInput {
  chatgptAccessToken: string;
  chatgptAccountId?: string;
  githubOwner: string;
  githubRepoName: string;
  label: string;
}

export interface CodingTurnStartInput {
  chatgptAccessToken: string;
  chatgptAccountId?: string;
  environmentId: string;
  prompt: string;
}

export interface CodingTurnPollInput {
  chatgptAccessToken: string;
  chatgptAccountId?: string;
  taskId: string;
}

export interface CodingBackend {
  readonly kind: CodingBackendKind;
  isTurnDone: (snapshot: NormalizedTurn) => boolean;
  pollTurn: (input: CodingTurnPollInput) => Promise<NormalizedTurn>;
  provisionEnvironment: (
    input: CodingProvisionInput
  ) => Promise<{ environmentId: string }>;
  startTurn: (input: CodingTurnStartInput) => Promise<{ taskId: string }>;
  status: (input: {
    environmentId?: string;
    provisionError?: string;
    provisionStatus: string;
  }) => CodingStatus;
}

export const statusFromWorkspace = (input: {
  environmentId?: string;
  provisionError?: string;
  provisionStatus: string;
}): CodingStatus => {
  if (input.provisionStatus === "error" || input.provisionError) {
    return "error";
  }
  if (input.provisionStatus === "provisioning") {
    return "running";
  }
  if (input.environmentId) {
    return "idle";
  }
  return "error";
};
