"use client";

import type { ReactNode } from "react";

import { StatusChip } from "@/components/screens/status-chip";
import { BrandMark } from "@/components/shell/brand-mark";
import { cn } from "@/lib/cn";
import type { BoardConnection } from "@/lib/connections-port";
import type { ServiceId } from "@/lib/services";

interface ServiceMeta {
  body: string;
  id: ServiceId;
  label: string;
  logo: string;
}

const ConnectionChip = ({
  connected,
  waiting,
}: {
  connected: boolean;
  waiting: boolean;
}) => {
  if (waiting) {
    return <StatusChip tone="wait">入力を待っています</StatusChip>;
  }
  if (connected) {
    return <StatusChip tone="ok">接続済み</StatusChip>;
  }
  return <StatusChip tone="idle">未接続</StatusChip>;
};

const ConnectCardAction = ({
  configured,
  connected,
  ctaDisabled,
  ctaLabel,
  hide,
  onConnect,
  onDisconnect,
}: {
  configured: boolean;
  connected: boolean;
  ctaDisabled: boolean;
  ctaLabel: string;
  hide: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) => {
  if (hide) {
    return null;
  }
  if (connected) {
    return (
      <button
        className="rounded-control bg-field text-ink-2 mt-4 h-9 px-3 text-[13px] font-medium"
        onClick={onDisconnect}
        type="button"
      >
        切断
      </button>
    );
  }
  return (
    <button
      className="btn-accent rounded-control mt-4 h-9 w-full text-[13px] font-medium disabled:opacity-40"
      disabled={ctaDisabled || !configured}
      onClick={onConnect}
      type="button"
    >
      {configured ? ctaLabel : "接続アプリ未設定"}
    </button>
  );
};

interface ConnectServiceCardProperties {
  configured: boolean;
  connection?: BoardConnection;
  ctaDisabled: boolean;
  ctaLabel: string;
  error?: string;
  extra?: ReactNode;
  featured?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  service: ServiceMeta;
  waiting?: boolean;
}

export const ConnectServiceCard = ({
  configured,
  connection,
  ctaDisabled,
  ctaLabel,
  error,
  extra,
  featured = false,
  onConnect,
  onDisconnect,
  service,
  waiting = false,
}: ConnectServiceCardProperties) => {
  const connected = connection?.status === "connected";
  const hideCta = extra !== undefined && waiting;
  return (
    <article
      className={cn(
        "rounded-card bg-surface shadow-card",
        featured ? "p-5" : "flex flex-col p-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <BrandMark alt="" src={service.logo} />
        <ConnectionChip connected={connected} waiting={waiting} />
      </div>
      <h2 className="mt-3 text-[16px] font-semibold">{service.label}</h2>
      <p className="text-ink-2 mt-1 text-[13px] leading-5">{service.body}</p>
      {connected ? (
        <p className="text-ink mt-3 text-[13px]">{connection.identity}</p>
      ) : null}
      {connection?.reconnectHint ? (
        <p className="text-ink-2 mt-2 text-[12px]">
          {connection.reconnectHint}
        </p>
      ) : null}
      {connection?.planWarning ? (
        <p className="text-ink-2 mt-2 text-[12px]">{connection.planWarning}</p>
      ) : null}
      {extra}
      <ConnectCardAction
        configured={configured}
        connected={connected}
        ctaDisabled={ctaDisabled}
        ctaLabel={ctaLabel}
        hide={hideCta}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
      {error ? <p className="text-ink-2 mt-3 text-[12px]">{error}</p> : null}
    </article>
  );
};
