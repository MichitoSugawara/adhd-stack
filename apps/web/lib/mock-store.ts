"use client";

import { useEffect, useState } from "react";

import { emptyConnections, emptyState, initialState } from "./mock-seed";
import type {
  AppState,
  ConnectionStatus,
  EnvLane,
  Message,
  Project,
} from "./mock-types";
import type { ServiceId } from "./services";
import { SERVICES } from "./services";

export const STORAGE_KEY = "adhd-stack-demo-v2";
const EVENT = "adhd-stack";

const asState = (value: unknown): AppState => {
  if (typeof value !== "object" || value === null) {
    return emptyState();
  }
  const row = value as Partial<AppState>;
  const next = emptyState();
  if (row.session && typeof row.session === "object") {
    next.session = row.session;
  }
  if (row.connections && typeof row.connections === "object") {
    next.connections = { ...emptyConnections(), ...row.connections };
  }
  if (Array.isArray(row.projects)) {
    next.projects = row.projects;
  }
  if (Array.isArray(row.previews)) {
    next.previews = row.previews;
  }
  if (row.messages && typeof row.messages === "object") {
    next.messages = row.messages;
  }
  if (typeof row.openaiKey === "string") {
    next.openaiKey = row.openaiKey;
  }
  if (typeof row.reservedPrompt === "string") {
    next.reservedPrompt = row.reservedPrompt;
  }
  if (Array.isArray(row.secrets)) {
    next.secrets = row.secrets;
  }
  if (Array.isArray(row.history)) {
    next.history = row.history;
  }
  if (Array.isArray(row.terminal)) {
    next.terminal = row.terminal;
  }
  if (row.banner) {
    next.banner = row.banner;
  }
  if (row.overlap) {
    next.overlap = row.overlap;
  }
  return next;
};

export const readState = (): AppState => {
  if (typeof window === "undefined") {
    return emptyState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? asState(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
};

export const writeState = (state: AppState): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT));
};

export const connectedCount = (connections: AppState["connections"]): number =>
  SERVICES.filter((service) => connections[service.id].status === "connected")
    .length;

export const allConnected = (connections: AppState["connections"]): boolean =>
  connectedCount(connections) === SERVICES.length;

const wait = async (ms: number) =>
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const slugOf = (name: string): string => {
  const ascii = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
  return ascii.length > 0 ? ascii.slice(0, 24) : `p-${Date.now()}`;
};

export const useMockApp = () => {
  const [state, setState] = useState<AppState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setState(readState());
      setHydrated(true);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const write = (next: AppState | ((prev: AppState) => AppState)) => {
    setState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      writeState(value);
      return value;
    });
  };

  const signIn = () => {
    write((prev) => {
      const seeded = prev.projects.length === 0 ? initialState() : prev;
      return {
        ...seeded,
        connections: prev.session ? prev.connections : emptyConnections(),
        session: { email: "demo@gawarago.com", name: "デモ" },
      };
    });
  };

  const signOut = () => {
    write(emptyState());
  };

  const setConnection = (
    id: ServiceId,
    status: ConnectionStatus,
    identity: string,
    error?: string
  ) => {
    write((prev) => {
      const next = {
        ...prev,
        connections: {
          ...prev.connections,
          [id]: { error, identity, status },
        },
      };
      if (status === "failed") {
        next.banner = { text: `${identity}の接続に失敗しました`, tone: "fail" };
      }
      if (status === "disconnected") {
        next.banner = { text: `${identity}を外しました`, tone: "disconnect" };
      }
      if (status === "connected") {
        next.banner = null;
        if (allConnected(next.connections) && prev.projects.length === 0) {
          const packed = initialState();
          next.projects = packed.projects;
          next.previews = packed.previews;
          next.messages = packed.messages;
          next.history = packed.history;
          next.terminal = packed.terminal;
          next.secrets = packed.secrets;
        }
      }
      return next;
    });
  };

  const connectService = async (id: ServiceId, key?: string) => {
    if (id === "openai") {
      const trimmed = (key ?? state.openaiKey).trim();
      if (trimmed.length < 8) {
        setConnection("openai", "failed", "OpenAI Codex", "キーが短すぎます");
        return;
      }
      if (trimmed.toLowerCase() === "failfail") {
        setConnection(
          "openai",
          "failed",
          "OpenAI Codex",
          "キーを確認できません"
        );
        return;
      }
      write((prev) => ({ ...prev, openaiKey: trimmed }));
      setConnection("openai", "connecting", "確認中");
      await wait(420);
      setConnection("openai", "connected", "デモキー");
      return;
    }
    setConnection(id, "connecting", "確認中");
    await wait(380);
    const names = {
      cloudflare: "demo-pages",
      convex: "demo-team",
      github: "@demo-michito",
      openai: "デモキー",
    } as const;
    const identity = names[id];
    setConnection(id, "connected", identity);
  };

  const disconnectService = (id: ServiceId) => {
    setConnection(id, "disconnected", "未選択");
  };

  const createProject = (name: string): string => {
    const id = slugOf(name);
    const project: Project = {
      creatingStep: 0,
      id,
      lastTalk: "まだ会話なし",
      liveUrl: "",
      name,
      reservedPrompt: "",
      status: "creating",
    };
    write((prev) => ({
      ...prev,
      messages: { ...prev.messages, [id]: [] },
      projects: [...prev.projects, project],
    }));
    return id;
  };

  const advanceCreate = (id: string, step: number) => {
    write((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => {
        if (project.id !== id) {
          return project;
        }
        const ready = step >= 5;
        return {
          ...project,
          creatingStep: Math.min(step, 5),
          status: ready ? "ready" : "creating",
        };
      }),
    }));
  };

  const reservePrompt = (id: string, text: string) => {
    write((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === id ? { ...project, reservedPrompt: text } : project
      ),
      reservedPrompt: text,
    }));
  };

  const appendMessage = (projectId: string, message: Omit<Message, "id">) => {
    write((prev) => {
      const list = prev.messages[projectId] ?? [];
      return {
        ...prev,
        messages: {
          ...prev.messages,
          [projectId]: [
            ...list,
            { ...message, id: `m_${list.length}_${Date.now()}` },
          ],
        },
        projects: prev.projects.map((project) =>
          project.id === projectId
            ? { ...project, lastTalk: message.body.slice(0, 24) }
            : project
        ),
      };
    });
  };

  const sendTalk = async (projectId: string, text: string) => {
    appendMessage(projectId, { body: text, kind: "user" });
    await wait(320);
    appendMessage(projectId, {
      body: "方針を組み立てています。",
      kind: "thinking",
    });
    await wait(420);
    appendMessage(projectId, {
      body: "画面を直しています。",
      kind: "cmd",
      meta: { command: "pnpm check" },
    });
    await wait(420);
    appendMessage(projectId, {
      body: "見出しとボタンを変えました。",
      kind: "changes",
      meta: {
        additions: 6,
        deletions: 1,
        files: [
          {
            file: "apps/web/app/page.tsx",
            lines: [
              { kind: "del", text: "  return <main>準備中</main>" },
              { kind: "add", text: "  return <main>ADHD Stack</main>" },
            ],
          },
        ],
      },
    });
  };

  const setOverlap = (open: boolean) => {
    write((prev) => ({
      ...prev,
      overlap: open
        ? {
            file: "apps/web/app/page.tsx",
            left: "予約する",
            right: "今日の席",
          }
        : null,
    }));
  };

  const promote = (previewId: string, lane: EnvLane) => {
    write((prev) => ({
      ...prev,
      previews: prev.previews.map((preview) =>
        preview.id === previewId ? { ...preview, kind: lane } : preview
      ),
    }));
  };

  const addSecret = (key: string, value: string, lane: EnvLane) => {
    write((prev) => ({
      ...prev,
      secrets: [...prev.secrets, { key, lane, value }],
    }));
  };

  const clearBanner = () => {
    write((prev) => ({ ...prev, banner: null }));
  };

  const loadDemo = () => {
    const packed = initialState();
    write({
      ...packed,
      connections: {
        cloudflare: { identity: "demo-pages", status: "connected" },
        convex: { identity: "demo-team", status: "connected" },
        github: { identity: "@demo-michito", status: "connected" },
        openai: { identity: "デモキー", status: "connected" },
      },
      session: { email: "demo@gawarago.com", name: "デモ" },
    });
  };

  return {
    addSecret,
    advanceCreate,
    allConnected: allConnected(state.connections),
    appendMessage,
    clearBanner,
    connectService,
    connectedCount: connectedCount(state.connections),
    createProject,
    disconnectService,
    hydrated,
    loadDemo,
    promote,
    reservePrompt,
    sendTalk,
    setOverlap,
    signIn,
    signOut,
    state,
    write,
  };
};
