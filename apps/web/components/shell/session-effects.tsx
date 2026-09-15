"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  connectErrorMessage,
  oauthErrorCopy,
  writeConnectError,
} from "@/lib/connect-error";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { enterShell } from "@/lib/shell-state";

const SessionEffectsLive = () => {
  const params = useSearchParams();
  const router = useRouter();
  const { confirmOc, refresh, signInWithTicket } = useConnectionsPort();
  const handledTicket = useRef<string | null>(null);
  const ticket = params.get("ticket");
  const connected = params.get("connected");
  const oauthError = params.get("oauth_error");
  const oc = params.get("oc");
  const ocName = params.get("name");

  useEffect(() => {
    if (!ticket || handledTicket.current === ticket) {
      return;
    }
    handledTicket.current = ticket;
    const run = async () => {
      try {
        await signInWithTicket(ticket);
        enterShell();
        refresh();
        router.replace("/connect");
      } catch (error) {
        writeConnectError(connectErrorMessage(error));
        router.replace("/connect");
      }
    };
    void run();
  }, [refresh, router, signInWithTicket, ticket]);

  useEffect(() => {
    if (!oauthError) {
      return;
    }
    writeConnectError(oauthErrorCopy(oauthError));
    router.replace("/connect");
  }, [oauthError, router]);

  useEffect(() => {
    if (!connected) {
      return;
    }
    enterShell();
    refresh();
    router.replace("/connect");
  }, [connected, refresh, router]);

  useEffect(() => {
    if ((oc !== "github" && oc !== "convex") || !ocName) {
      return;
    }
    let cancelled = false;
    let timer = 0;
    const confirm = async () => {
      try {
        const result = await confirmOc({
          connectionName: ocName,
          service: oc,
        });
        if (cancelled || result.status === "pending") {
          return false;
        }
        if (result.status === "authorized") {
          await signInWithTicket(result.ticket);
        }
        enterShell();
        refresh();
        router.replace("/connect");
        return true;
      } catch (error) {
        if (!cancelled) {
          writeConnectError(connectErrorMessage(error));
          router.replace("/connect");
        }
        return true;
      }
    };
    const loop = async () => {
      const done = await confirm();
      if (done) {
        window.clearInterval(timer);
      }
    };
    timer = window.setInterval(() => {
      void loop();
    }, 2500);
    void loop();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [confirmOc, oc, ocName, refresh, router, signInWithTicket]);

  return null;
};

export const SessionEffects = () => {
  if (!hasConvexUrl()) {
    return null;
  }
  return <SessionEffectsLive />;
};
