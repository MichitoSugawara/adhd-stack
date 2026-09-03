"use client";

import Image from "next/image";

import { SERVICE_META } from "../lib/mock-copy";
import type { ServiceId } from "../lib/services";
import { SERVICES, STATUS_LABELS } from "../lib/services";
import type { NodeStatus } from "../lib/use-connect-board";

interface MarketCardProperties {
  identity: string;
  onConnect: () => void;
  onDisconnect: () => void;
  serviceId: ServiceId;
  status: NodeStatus;
  warning?: string;
}

export const MarketCard = ({
  identity,
  onConnect,
  onDisconnect,
  serviceId,
  status,
  warning,
}: MarketCardProperties) => {
  const service = SERVICES.find((item) => item.id === serviceId);
  if (!service) {
    return null;
  }
  const meta = SERVICE_META[serviceId];
  const connected = status === "connected";
  return (
    <article className={`market-card market-card--${status}`}>
      <span className="card-chip">{service.category}</span>
      <span className="market-logo" aria-hidden="true">
        <Image
          alt=""
          className="service-logo-image"
          height={40}
          src={service.logo}
          width={40}
        />
      </span>
      <h2>{service.label}</h2>
      <p className="market-permission">{meta.permission}</p>
      <p className={`status status--${status}`}>
        <i aria-hidden="true" />
        {STATUS_LABELS[status]}
      </p>
      <p className="service-identity">{identity}</p>
      {warning ? <p className="service-identity">{warning}</p> : null}
      <p className="service-meta">対象 {meta.target}</p>
      {connected ? (
        <button
          className="atelier-btn atelier-btn--ghost market-cta"
          onClick={onDisconnect}
          type="button"
        >
          外す
        </button>
      ) : (
        <button
          className="atelier-btn market-cta"
          disabled={status === "connecting"}
          onClick={onConnect}
          type="button"
        >
          {status === "connecting" ? "接続中…" : "デモ接続"}
        </button>
      )}
    </article>
  );
};
