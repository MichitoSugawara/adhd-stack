"use client";

import { useEffect, useState } from "react";

import { MOCK_IDENTITIES, MOCK_REPO } from "./mock-copy";
import type {
  MockConnections,
  MockMessage,
  MockState,
  MockWorkspace,
} from "./mock-types";
import { SERVICES } from "./services";
import type { ServiceId } from "./services";

export const DEMO_STORAGE_KEY = "adhd-stack-demo-v1";
const DEMO_EVENT = "adhd-demo";

const emptyConnections = (): MockConnections => ({
  chatgpt: { identity: "アカウント未選択", status: "disconnected" },
  cloudflare: { identity: "アカウント未選択", status: "disconnected" },
  convex: { identity: "アカウント未選択", status: "disconnected" },
  github: { identity: "アカウント未選択", status: "disconnected" },
});

export const emptyMockState = (): MockState => ({
  connections: emptyConnections(),
  messages: [],
  publish: { status: "idle" },
  workspace: null,
});

const isServiceId = (value: string): value is ServiceId =>
  SERVICES.some((service) => service.id === value);

const asState = (value: unknown): MockState => {
  if (typeof value !== "object" || value === null) {
    return emptyMockState();
  }
  const row = value as Partial<MockState>;
  const next = emptyMockState();
  if (row.connections && typeof row.connections === "object") {
    for (const [key, connection] of Object.entries(row.connections)) {
      if (isServiceId(key) && connection) {
        next.connections[key] = {
          connectedAt: connection.connectedAt,
          identity: connection.identity,
          status:
            connection.status === "connected" ? "connected" : "disconnected",
        };
      }
    }
  }
  if (Array.isArray(row.messages)) {
    next.messages = row.messages;
  }
  if (row.publish && typeof row.publish === "object") {
    next.publish = row.publish;
  }
  if (row.workspace && typeof row.workspace === "object") {
    next.workspace = row.workspace;
  }
  return next;
};

export const readMockState = (): MockState => {
  if (typeof window === "undefined") {
    return emptyMockState();
  }
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? asState(JSON.parse(raw)) : emptyMockState();
  } catch {
    return emptyMockState();
  }
};

export const writeMockState = (state: MockState): void => {
  window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(DEMO_EVENT));
};

export const connectedCountOf = (connections: MockConnections): number =>
  SERVICES.filter((service) => connections[service.id].status === "connected")
    .length;

export const allConnectedOf = (connections: MockConnections): boolean =>
  connectedCountOf(connections) === SERVICES.length;

export const readyWorkspace = (): MockWorkspace => ({
  cloudflarePagesUrl: MOCK_REPO.pagesUrl,
  cloudflareProjectName: MOCK_REPO.name,
  codexEnvironmentId: MOCK_REPO.envId,
  convexProjectSlug: MOCK_REPO.project,
  convexUrl: `https://${MOCK_REPO.project}.convex.cloud`,
  githubOwner: MOCK_REPO.owner,
  githubRepoFullName: MOCK_REPO.fullName,
  githubRepoId: 0,
  githubRepoName: MOCK_REPO.name,
  githubRepoUrl: MOCK_REPO.url,
  name: "app",
  provisionStatus: "ready",
});

export const connectMockService = (
  state: MockState,
  serviceId: ServiceId
): MockState => {
  const connections = {
    ...state.connections,
    [serviceId]: {
      connectedAt: Date.now(),
      identity: MOCK_IDENTITIES[serviceId],
      status: "connected" as const,
    },
  };
  return { ...state, connections };
};

export const disconnectMockService = (
  state: MockState,
  serviceId: ServiceId
): MockState => ({
  ...state,
  connections: {
    ...state.connections,
    [serviceId]: { identity: "アカウント未選択", status: "disconnected" },
  },
  workspace: allConnectedOf(state.connections) ? state.workspace : null,
});

export const appendMessage = (
  state: MockState,
  message: Omit<MockMessage, "_id" | "createdAt">
): MockState => ({
  ...state,
  messages: [
    ...state.messages,
    {
      ...message,
      _id: `msg_${Date.now()}_${state.messages.length}`,
      createdAt: Date.now(),
    },
  ],
});

export const useMockApp = () => {
  const [state, setState] = useState<MockState>(emptyMockState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setState(readMockState());
      setHydrated(true);
    };
    sync();
    window.addEventListener(DEMO_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DEMO_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const write = (next: MockState | ((prev: MockState) => MockState)) => {
    setState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      writeMockState(value);
      return value;
    });
  };

  const reset = () => {
    write(emptyMockState());
  };

  return { hydrated, reset, state, write };
};
