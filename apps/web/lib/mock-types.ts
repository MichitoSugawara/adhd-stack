import type { ServiceId } from "./services";

export type ConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "failed";

export interface Connection {
  error?: string;
  identity: string;
  status: ConnectionStatus;
}

export type Connections = Record<ServiceId, Connection>;

export type ProjectStatus = "creating" | "ready";

export interface Project {
  creatingStep: number;
  id: string;
  lastTalk: string;
  liveUrl: string;
  name: string;
  reservedPrompt: string;
  status: ProjectStatus;
}

export type PreviewKind = "draft" | "live" | "review";

export interface Preview {
  id: string;
  kind: PreviewKind;
  projectId: string;
  title: string;
  url: string;
}

export type MessageKind =
  | "approval"
  | "changes"
  | "cmd"
  | "limit"
  | "published"
  | "question"
  | "secret"
  | "thinking"
  | "user";

export interface ChangeLine {
  kind: "add" | "ctx" | "del";
  text: string;
}

export interface ChangeFile {
  file: string;
  lines: ChangeLine[];
}

export interface Message {
  body: string;
  id: string;
  kind: MessageKind;
  meta?: {
    additions?: number;
    command?: string;
    deletions?: number;
    files?: ChangeFile[];
    options?: string[];
  };
}

export type EnvLane = "draft" | "live" | "review";

export interface SecretRow {
  key: string;
  lane: EnvLane;
  value: string;
}

export interface Overlap {
  file: string;
  left: string;
  right: string;
}

export interface Banner {
  text: string;
  tone: "disconnect" | "fail";
}

export interface Session {
  email: string;
  name: string;
}

export interface TerminalLine {
  text: string;
  tone: "err" | "ok" | "plain";
}

export interface HistoryPoint {
  id: string;
  title: string;
  when: string;
}

export interface AppState {
  banner: Banner | null;
  connections: Connections;
  history: HistoryPoint[];
  messages: Record<string, Message[]>;
  openaiKey: string;
  overlap: Overlap | null;
  previews: Preview[];
  projects: Project[];
  reservedPrompt: string;
  secrets: SecretRow[];
  session: Session | null;
  terminal: TerminalLine[];
}
