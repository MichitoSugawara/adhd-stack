import type { ServiceId } from "./services";

export type ConnectionStatus = "connected" | "disconnected";

export interface MockConnection {
  connectedAt?: number;
  identity: string;
  status: ConnectionStatus;
}

export type MessageKind = "command" | "diff" | "text" | "thinking" | "work";

export type DiffLineKind = "add" | "ctx" | "del";

export interface MockDiffLine {
  kind: DiffLineKind;
  text: string;
}

export interface MockDiffHunk {
  file: string;
  lines: MockDiffLine[];
}

export interface MockMessage {
  _id: string;
  body: string;
  createdAt: number;
  kind: MessageKind;
  meta?: {
    additions?: number;
    command?: string;
    deletions?: number;
    files?: string[];
    hunks?: MockDiffHunk[];
  };
  role: "assistant" | "system" | "user";
}

export type ProvisionStatus = "error" | "idle" | "provisioning" | "ready";

export interface MockWorkspace {
  cloudflarePagesUrl?: string;
  cloudflareProjectName?: string;
  codexEnvironmentId?: string;
  convexProjectSlug?: string;
  convexUrl?: string;
  githubOwner: string;
  githubRepoFullName: string;
  githubRepoId: number;
  githubRepoName: string;
  githubRepoUrl: string;
  name: string;
  provisionError?: string;
  provisionStatus: ProvisionStatus;
}

export interface MockPublish {
  at?: number;
  convexUrl?: string;
  pagesUrl?: string;
  status: "idle" | "published" | "publishing";
}

export type MockConnections = Record<ServiceId, MockConnection>;

export interface MockState {
  connections: MockConnections;
  messages: MockMessage[];
  publish: MockPublish;
  workspace: MockWorkspace | null;
}
