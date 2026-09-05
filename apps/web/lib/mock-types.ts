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
  latestPreview: string;
  liveUrl: string;
  name: string;
  reservedPrompt: string;
  rowState: string;
  status: ProjectStatus;
  updated: string;
}

export type PreviewKind = "draft" | "live" | "review";

export interface SavePoint {
  title: string;
  when: string;
}

export interface Preview {
  conflict: boolean;
  id: string;
  kind: PreviewKind;
  projectId: string;
  savepoints: SavePoint[];
  slug: string;
  state: string;
  title: string;
  url: string;
}

export type MessageKind =
  | "ai"
  | "approval"
  | "changes"
  | "cmd"
  | "limit"
  | "published"
  | "question"
  | "secret"
  | "status"
  | "thinking"
  | "user";

export interface ChangeLine {
  kind: "add" | "ctx" | "del";
  text: string;
}

export interface ChangeFile {
  add: string;
  del: string;
  file: string;
  lines: ChangeLine[];
}

export interface TalkOption {
  label: string;
  note?: string;
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
    lines?: string[];
    note?: string;
    options?: TalkOption[];
    seconds?: string;
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
  tone: "err" | "hint" | "ok" | "plain";
}

export interface HistoryPoint {
  current?: boolean;
  id: string;
  meta: string;
  title: string;
  when: string;
  where: "live" | "preview" | "review";
}

export interface ProdHistory {
  label: string;
  when: string;
}

export interface SideMessage {
  action?: string;
  body: string;
  id: string;
  kind: "ai" | "status" | "user";
}

export interface AppState {
  banner: Banner | null;
  busy: boolean;
  connecting: ServiceId | null;
  connections: Connections;
  deployFailed: boolean;
  dirty: boolean;
  failed: ServiceId | null;
  history: HistoryPoint[];
  messages: Record<string, Message[]>;
  openaiKey: string;
  overlap: Overlap | null;
  previews: Preview[];
  prod: number;
  prodHistory: ProdHistory[];
  projects: Project[];
  reservedPrompt: string;
  returnSummary: boolean;
  secrets: SecretRow[];
  session: Session | null;
  sideMessages: SideMessage[];
  staging: number;
  terminal: TerminalLine[];
  toast: string;
  usage: number;
}
