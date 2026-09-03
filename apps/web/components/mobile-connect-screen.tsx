"use client";

import { StackIcon } from "@phosphor-icons/react";
import {
  App as KonstaApp,
  Button as KonstaButton,
  Glass as KonstaGlass,
  Page as KonstaPage,
  Progressbar as KonstaProgressbar,
} from "konsta/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { connectFontVariables } from "../lib/connect-fonts";
import { SERVICE_META } from "../lib/mock-copy";
import { SERVICES, STATUS_LABELS } from "../lib/services";
import type { useConnectBoard } from "../lib/use-connect-board";
import { DemoBanner } from "./demo-banner";
import { StageStrip } from "./stage-strip";

interface MobileConnectScreenProperties {
  board: ReturnType<typeof useConnectBoard>;
}

export const MobileConnectScreen = ({
  board,
}: MobileConnectScreenProperties) => {
  const router = useRouter();
  const {
    allConnected,
    connect,
    connectedCount,
    identityFor,
    onDisconnect,
    startDemo,
    startingDemo,
    statusFor,
    warningFor,
  } = board;

  return (
    <KonstaApp
      className={`mobile-experience ${connectFontVariables}`}
      dark
      safeAreas
      theme="ios"
    >
      <KonstaPage className="mobile-page mobile-connect-page">
        <div className="mobile-connect-orb" />
        <div className="mobile-scroll-content">
          <header className="mobile-app-header">
            <span className="mobile-account-pill" aria-hidden="true">
              <StackIcon size={18} weight="bold" />
            </span>
          </header>
          <section
            className="mobile-title-block"
            aria-labelledby="mobile-title"
          >
            <p>01 · CONNECT</p>
            <h1 id="mobile-title">接続</h1>
            <span>カードをタップすると、モック接続になります。</span>
          </section>
          <StageStrip current="CONNECT" />
          <DemoBanner />
          <div className="mobile-node-grid">
            {SERVICES.map((service) => {
              const status = statusFor(service.id);
              const isConnected = status === "connected";
              const meta = SERVICE_META[service.id];
              let identityLabel = "タップしてデモ接続";
              if (isConnected) {
                identityLabel = identityFor(service.id);
              } else if (warningFor(service.id)) {
                identityLabel = warningFor(service.id) ?? "タップしてデモ接続";
              }
              return (
                <button
                  aria-label={`${service.label}: ${STATUS_LABELS[status]}`}
                  className="mobile-card-button"
                  disabled={status === "connecting"}
                  key={service.id}
                  onClick={() => {
                    if (isConnected) {
                      onDisconnect(service.id);
                      return;
                    }
                    void connect(service.id);
                  }}
                  type="button"
                >
                  <KonstaGlass
                    className={`mobile-service-card mobile-service-card--${status}`}
                  >
                    <span className="card-chip">{service.category}</span>
                    <span className="mobile-service-icon" aria-hidden="true">
                      <Image
                        alt=""
                        className="service-logo-image"
                        height={28}
                        src={service.logo}
                        width={28}
                      />
                    </span>
                    <span className="mobile-service-name">{service.label}</span>
                    <span className={`mobile-status mobile-status--${status}`}>
                      <i aria-hidden="true" />
                      {status === "connecting"
                        ? "接続しています…"
                        : STATUS_LABELS[status]}
                    </span>
                    <span className="mobile-service-identity">
                      {identityLabel}
                    </span>
                    <span className="mobile-service-meta">{meta.target}</span>
                  </KonstaGlass>
                </button>
              );
            })}
          </div>
          <section className="mobile-progress" aria-label="接続の進捗">
            <div>
              <span>デモの進捗</span>
              <strong>{connectedCount}/4</strong>
            </div>
            <KonstaProgressbar progress={connectedCount / SERVICES.length} />
          </section>
        </div>
        <div className="mobile-bottom-dock">
          <KonstaGlass className="mobile-glass-bar">
            <div>
              <strong>
                {allConnected ? "デモ準備完了" : `あと${4 - connectedCount}つ`}
              </strong>
              <span>
                {allConnected
                  ? "モックのエディタを開けます"
                  : "カードをタップ、または一括デモ"}
              </span>
            </div>
            {allConnected ? (
              <KonstaButton
                aria-label="エディタを開く"
                className="mobile-primary-action"
                onClick={() => router.push("/editor")}
                rounded
              >
                エディタを開く
              </KonstaButton>
            ) : (
              <KonstaButton
                aria-label="デモを開始"
                className="mobile-primary-action"
                disabled={startingDemo}
                onClick={() => {
                  void startDemo();
                }}
                rounded
              >
                デモを開始
              </KonstaButton>
            )}
          </KonstaGlass>
        </div>
      </KonstaPage>
    </KonstaApp>
  );
};
