"use client";

import type { ReactNode } from "react";

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

const SERVICE_PURPOSE = {
  chatgpt: "アイデアを、一緒にアプリにする。",
  cloudflare: "できたアプリを、インターネットへ。",
  convex: "アプリのデータを、安全に保存する。",
  github: "作ったものと、これまでの変更を保存する。",
} satisfies Record<ServiceId, string>;

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

const connectionStatus = (connected: boolean, waiting: boolean): string => {
  if (waiting) {
    return "入力待ち";
  }
  return connected ? "接続済み" : "未接続";
};

const ConnectionAction = ({
  configured,
  connected,
  ctaDisabled,
  ctaLabel,
  featured,
  onConnect,
  onDisconnect,
  service,
}: Pick<
  ConnectServiceCardProperties,
  | "configured"
  | "ctaDisabled"
  | "ctaLabel"
  | "featured"
  | "onConnect"
  | "onDisconnect"
  | "service"
> & { connected: boolean }) => {
  let label = configured ? ctaLabel : "設定待ち";
  if (connected) {
    label = "切断";
  }
  return (
    <button
      aria-label={`${service.label} ${connected ? "を切断" : "に接続"}`}
      className={cn(
        "ui-button connection-action",
        !connected && configured && featured && "ui-button-primary"
      )}
      disabled={ctaDisabled || (!connected && !configured)}
      onClick={connected ? onDisconnect : onConnect}
      type="button"
    >
      {label}
      {connected || !configured ? null : <span aria-hidden="true">↗</span>}
    </button>
  );
};

const ConnectionNotices = ({
  connection,
}: {
  connection?: BoardConnection;
}) => (
  <>
    {connection?.reconnectHint ? (
      <p className="connection-card-note">{connection.reconnectHint}</p>
    ) : null}
    {connection?.planWarning ? (
      <p className="connection-card-note">{connection.planWarning}</p>
    ) : null}
  </>
);

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
  const hideCta = Boolean(extra) && waiting;
  const status = connectionStatus(connected, waiting);

  return (
    <article
      aria-labelledby={`connection-${service.id}`}
      className={cn(
        "connection-card",
        featured && !connected && "connection-card-featured",
        connected && "connection-card-connected"
      )}
    >
      <div className="connection-provider-row">
        <div className="connection-provider-icon">
          <BrandMark alt="" src={service.logo} />
        </div>
        <div className="connection-provider-copy">
          <div className="connection-provider-title">
            <h2 id={`connection-${service.id}`}>{service.label}</h2>
            {featured && !connected && !waiting ? (
              <span className="connection-recommended">ここから始める</span>
            ) : null}
          </div>
          <p>{SERVICE_PURPOSE[service.id]}</p>
          {connected ? (
            <p className="connection-identity">{connection.identity}</p>
          ) : null}
        </div>
        <div className="connection-provider-action">
          <span
            className={cn(
              "connection-status",
              connected && "connection-status-connected",
              waiting && "connection-status-waiting"
            )}
          >
            <span aria-hidden="true" />
            {status}
          </span>
          {hideCta ? null : (
            <ConnectionAction
              configured={configured}
              connected={connected}
              ctaDisabled={ctaDisabled}
              ctaLabel={ctaLabel}
              featured={featured}
              onConnect={onConnect}
              onDisconnect={onDisconnect}
              service={service}
            />
          )}
        </div>
      </div>
      <ConnectionNotices connection={connection} />
      {extra}
      {error ? (
        <p className="connection-error" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
};
