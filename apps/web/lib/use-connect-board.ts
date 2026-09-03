"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { api } from "../../../convex/_generated/api";
import { SERVICES } from "./services";
import type { ServiceId } from "./services";
import { useBoardNow } from "./use-board-now";

export type NodeStatus = "connected" | "connecting" | "disconnected";

export interface ChatgptDevicePrompt {
  deviceAuthId: string;
  intervalSeconds: number;
  startedAt: number;
  userCode: string;
  verificationUrl: string;
  verificationUrlFallback: string;
}

const openChatgptDevicePage = (
  verificationUrl: string,
  verificationUrlFallback: string
) => {
  const opened = window.open(verificationUrl, "_blank", "noopener,noreferrer");
  if (opened) {
    return;
  }
  window.open(verificationUrlFallback, "_blank", "noopener,noreferrer");
};

interface PublicConnection {
  identity: string;
  planWarning?: string;
  provider: ServiceId;
  reconnectHint?: string;
  status: "connected" | "disconnected";
}

export const useConnectBoard = () => {
  const now = useBoardNow();
  const board = useQuery(api.connections.getBoard, { now });
  const beginConnect = useAction(api.oauth.beginConnect);
  const beginChatgptDevice = useAction(api.oauth.beginChatgptDevice);
  const pollChatgptDevice = useAction(api.oauth.pollChatgptDevice);
  const disconnect = useMutation(api.connections.disconnect);
  const attachTicket = useMutation(api.accountMerge.attachTicket);
  const mergeMyDuplicates = useMutation(api.accountMerge.mergeMyDuplicates);
  const { isAuthenticated } = useConvexAuth();
  const { signIn, signOut } = useAuthActions();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState<ServiceId | null>(null);
  const [chatgptDevice, setChatgptDevice] =
    useState<ChatgptDevicePrompt | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(() =>
    searchParams.get("oauth_error")
  );
  const expiredHint =
    board?.connections.find((item) => item.reconnectHint)?.reconnectHint ??
    null;
  const pollGeneration = useRef(0);
  const mergeStarted = useRef(false);

  const connections: PublicConnection[] = board?.connections ?? [];
  const statusFor = (id: ServiceId): NodeStatus => {
    if (pending === id || (id === "chatgpt" && chatgptDevice)) {
      return "connecting";
    }
    const row = connections.find(
      (item: PublicConnection) => item.provider === id
    );
    return row?.status === "connected" ? "connected" : "disconnected";
  };
  const identityFor = (id: ServiceId): string => {
    if (id === "chatgpt" && chatgptDevice) {
      return "確認待ち";
    }
    const row = connections.find(
      (item: PublicConnection) => item.provider === id
    );
    return row?.status === "connected" ? row.identity : "アカウント未選択";
  };
  const warningFor = (id: ServiceId): string | undefined => {
    const row = connections.find(
      (item: PublicConnection) => item.provider === id
    );
    return row?.planWarning ?? row?.reconnectHint;
  };
  const connectedCount = SERVICES.filter(
    (service) => statusFor(service.id) === "connected"
  ).length;
  const allConnected = Boolean(board?.allConnected);

  useEffect(() => {
    if (!chatgptDevice) {
      return;
    }
    const generation = pollGeneration.current;
    let timer = 0;
    const tick = async () => {
      try {
        const result = await pollChatgptDevice({
          deviceAuthId: chatgptDevice.deviceAuthId,
          startedAt: chatgptDevice.startedAt,
          userCode: chatgptDevice.userCode,
        });
        if (generation !== pollGeneration.current) {
          return;
        }
        if (result.status === "pending") {
          timer = window.setTimeout(tick, chatgptDevice.intervalSeconds * 1000);
          return;
        }
        if (result.ticket) {
          await (isAuthenticated
            ? attachTicket({ ticket: result.ticket })
            : signIn("ticket", { ticket: result.ticket }));
        }
        setChatgptDevice(null);
        setPending(null);
      } catch (error) {
        if (generation !== pollGeneration.current) {
          return;
        }
        setChatgptDevice(null);
        setPending(null);
        setOauthError(
          error instanceof Error
            ? error.message
            : "ChatGPT の接続に失敗しました"
        );
      }
    };
    timer = window.setTimeout(tick, chatgptDevice.intervalSeconds * 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [attachTicket, chatgptDevice, isAuthenticated, pollChatgptDevice, signIn]);

  useEffect(() => {
    if (!isAuthenticated || mergeStarted.current) {
      return;
    }
    mergeStarted.current = true;
    const run = async () => {
      try {
        await mergeMyDuplicates({});
      } catch {
        mergeStarted.current = false;
      }
    };
    void run();
  }, [isAuthenticated, mergeMyDuplicates]);

  const connect = async (serviceId: ServiceId) => {
    setOauthError(null);
    setPending(serviceId);
    if (serviceId === "chatgpt") {
      try {
        const device = await beginChatgptDevice({});
        pollGeneration.current += 1;
        setChatgptDevice({
          ...device,
          startedAt: Date.now(),
        });
      } catch (error) {
        setPending(null);
        setOauthError(
          error instanceof Error ? error.message : "接続に失敗しました"
        );
      }
      return;
    }
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

  const cancelChatgptDevice = () => {
    pollGeneration.current += 1;
    setChatgptDevice(null);
    setPending(null);
  };

  const openChatgptDevice = () => {
    if (!chatgptDevice) {
      return;
    }
    openChatgptDevicePage(
      chatgptDevice.verificationUrl,
      chatgptDevice.verificationUrlFallback
    );
  };

  const onDisconnect = async (serviceId: ServiceId) => {
    setOauthError(null);
    if (serviceId === "chatgpt") {
      cancelChatgptDevice();
    }
    await disconnect({ provider: serviceId });
  };

  return {
    allConnected,
    authenticated: Boolean(board?.authenticated),
    cancelChatgptDevice,
    chatgptDevice,
    configured: board?.configured,
    connect,
    connectedCount,
    identityFor,
    oauthError: oauthError ?? expiredHint,
    onDisconnect,
    openChatgptDevice,
    signOut,
    statusFor,
    warningFor,
  };
};
