"use client";

import type { ReactNode } from "react";

import { BrandMark } from "@/components/shell/brand-mark";
import type { BoardConnection } from "@/lib/connections-port";
import type { ServiceId } from "@/lib/services";

interface ServiceMeta {
  body: string;
  id: ServiceId;
  label: string;
  logo: string;
}

interface ConnectServiceCardProperties {
  configured: boolean;
  connection?: BoardConnection;
  ctaDisabled: boolean;
  ctaLabel: string;
  error?: string;
  extra?: ReactNode;
  onConnect: () => void;
  onDisconnect: () => void;
  service: ServiceMeta;
}

export const ConnectServiceCard = ({
  configured,
  connection,
  ctaDisabled,
  ctaLabel,
  error,
  extra,
  onConnect,
  onDisconnect,
  service,
}: ConnectServiceCardProperties) => {
  const connected = connection?.status === "connected";
  return (
    <article className="rounded-card bg-surface shadow-card p-4">
      <div className="flex items-start justify-between gap-3">
        <BrandMark alt="" src={service.logo} />
        <span className="rounded-chip bg-field text-ink-3 px-2 py-1 text-[12px] font-medium">
          {connected ? "接続済み" : "未接続"}
        </span>
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
      {connected ? (
        <button
          className="rounded-control bg-field text-ink mt-4 h-8 px-3 text-[13px] font-medium"
          onClick={onDisconnect}
          type="button"
        >
          切断
        </button>
      ) : (
        <button
          className="rounded-control bg-ink text-surface mt-4 h-8 px-3 text-[13px] font-medium disabled:opacity-40"
          disabled={ctaDisabled || !configured}
          onClick={onConnect}
          type="button"
        >
          {configured ? ctaLabel : "接続アプリ未設定"}
        </button>
      )}
      {extra}
      {error ? <p className="text-ink-2 mt-3 text-[12px]">{error}</p> : null}
    </article>
  );
};
