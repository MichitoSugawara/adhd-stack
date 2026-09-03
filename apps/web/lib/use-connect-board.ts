"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { api } from "../../../convex/_generated/api";
import { SERVICES } from "./services";
import type { ServiceId } from "./services";

export type NodeStatus = "connected" | "connecting" | "disconnected";

interface PublicConnection {
  identity: string;
  planWarning?: string;
  provider: ServiceId;
  status: "connected" | "disconnected";
}

export const useConnectBoard = () => {
  const board = useQuery(api.connections.getBoard);
  const beginConnect = useAction(api.oauth.beginConnect);
  const disconnect = useMutation(api.connections.disconnect);
  const { signOut } = useAuthActions();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<ServiceId | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(() =>
    searchParams.get("oauth_error")
  );

  const connections: PublicConnection[] = board?.connections ?? [];
  const statusFor = (id: ServiceId): NodeStatus => {
    if (pending === id) {
      return "connecting";
    }
    const row = connections.find(
      (item: PublicConnection) => item.provider === id
    );
    return row?.status === "connected" ? "connected" : "disconnected";
  };
  const identityFor = (id: ServiceId): string => {
    const row = connections.find(
      (item: PublicConnection) => item.provider === id
    );
    return row?.status === "connected" ? row.identity : "アカウント未選択";
  };
  const warningFor = (id: ServiceId): string | undefined => {
    const row = connections.find(
      (item: PublicConnection) => item.provider === id
    );
    return row?.planWarning;
  };
  const connectedCount = SERVICES.filter(
    (service) => statusFor(service.id) === "connected"
  ).length;
  const allConnected = Boolean(board?.allConnected);

  const connect = async (serviceId: ServiceId) => {
    setOauthError(null);
    setPending(serviceId);
    try {
      const url = await beginConnect({ provider: serviceId });
      window.location.assign(url);
    } catch (error) {
      setPending(null);
      setOauthError(
        error instanceof Error ? error.message : "接続に失敗しました"
      );
    }
  };

  const onDisconnect = async (serviceId: ServiceId) => {
    setOauthError(null);
    await disconnect({ provider: serviceId });
  };

  return {
    allConnected,
    authenticated: Boolean(board?.authenticated),
    configured: board?.configured,
    connect,
    connectedCount,
    identityFor,
    oauthError,
    onDisconnect,
    signOut,
    statusFor,
    warningFor,
  };
};
