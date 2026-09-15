"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useQuery } from "convex/react";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { ServiceId } from "./services";

export type ConnectionStatus = "connected" | "disconnected";

export interface BoardConnection {
  identity: string;
  planWarning?: string;
  provider: ServiceId;
  reconnectHint?: string;
  status: ConnectionStatus;
}

export interface ConnectionsBoard {
  allConnected: boolean;
  authenticated: boolean;
  configured: Record<ServiceId, boolean>;
  connections: BoardConnection[];
}

export const useConnectionsPort = () => {
  const [now, setNow] = useState(() => Date.now());
  const board = useQuery(api.connections.getBoard, { now });
  const beginConnect = useAction(api.oauth.beginConnect);
  const confirmOc = useAction(api.oauth.confirmOcConnect);
  const disconnect = useAction(api.connections.disconnect);
  const beginDevice = useAction(api.oauth.beginChatgptDevice);
  const pollDevice = useAction(api.oauth.pollChatgptDevice);
  const { signIn } = useAuthActions();

  return {
    beginConnect,
    beginDevice,
    board,
    confirmOc,
    disconnect,
    pollDevice,
    refresh: () => {
      setNow(Date.now());
    },
    signInWithTicket: async (ticket: string) => {
      await signIn("ticket", { ticket });
    },
  };
};
