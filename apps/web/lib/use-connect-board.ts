"use client";

import { useState } from "react";

import { MOCK_LABEL } from "./mock-copy";
import {
  allConnectedOf,
  connectMockService,
  connectedCountOf,
  disconnectMockService,
  emptyMockState,
  useMockApp,
} from "./mock-store";
import { SERVICES } from "./services";
import type { ServiceId } from "./services";

export type NodeStatus = "connected" | "connecting" | "disconnected";

export interface ChatgptDevicePrompt {
  deviceAuthId: string;
  intervalSeconds: number;
  startedAt: number;
  userCode: string;
  verificationUrl: string;
  verificationUrlFallback: string;
}

const delay = (ms: number, done: () => void) => {
  window.setTimeout(done, ms);
};

const wait = async (ms: number) => {
  await new Promise<void>((resolve) => {
    delay(ms, resolve);
  });
};

export const useConnectBoard = () => {
  const { reset, state, write } = useMockApp();
  const [pending, setPending] = useState<ServiceId | "all" | null>(null);

  const statusFor = (id: ServiceId): NodeStatus => {
    if (pending === id || pending === "all") {
      if (state.connections[id].status === "connected") {
        return "connected";
      }
      return "connecting";
    }
    return state.connections[id].status;
  };

  const identityFor = (id: ServiceId): string =>
    state.connections[id].status === "connected"
      ? state.connections[id].identity
      : "アカウント未選択";

  const warningFor = (id: ServiceId): string | undefined =>
    state.connections[id].status === "connected" ? MOCK_LABEL : undefined;

  const connectedCount = connectedCountOf(state.connections);
  const allConnected = allConnectedOf(state.connections);

  const connect = async (serviceId: ServiceId) => {
    if (state.connections[serviceId].status === "connected") {
      return;
    }
    setPending(serviceId);
    await wait(420);
    write((prev) => connectMockService(prev, serviceId));
    setPending(null);
  };

  const startDemo = async () => {
    setPending("all");
    let next = state;
    for (const service of SERVICES) {
      await wait(280);
      next = connectMockService(next, service.id);
      write(next);
    }
    setPending(null);
  };

  const onDisconnect = (serviceId: ServiceId) => {
    write((prev) => disconnectMockService(prev, serviceId));
  };

  return {
    allConnected,
    configured: {
      chatgpt: true,
      cloudflare: true,
      convex: true,
      github: true,
    },
    connect,
    connectedCount,
    identityFor,
    onDisconnect,
    resetDemo: () => {
      reset();
      write(emptyMockState());
    },
    startDemo,
    startingDemo: pending === "all",
    statusFor,
    warningFor,
  };
};
