"use client";

import { StackIcon } from "@phosphor-icons/react";
import { App as KonstaApp, Page as KonstaPage } from "konsta/react";
import { useRouter } from "next/navigation";

import { connectFontVariables } from "../lib/connect-fonts";
import { SERVICES } from "../lib/services";
import type { useConnectBoard } from "../lib/use-connect-board";
import { DemoBanner } from "./demo-banner";
import { MarketCard } from "./market-card";
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
      className={`atelier mobile-experience ${connectFontVariables}`}
      safeAreas
      theme="ios"
    >
      <KonstaPage className="mobile-page mobile-connect-page">
        <div className="mobile-scroll-content">
          <header className="mobile-app-header">
            <span className="brand-mark" aria-hidden="true">
              <StackIcon size={16} weight="bold" />
            </span>
          </header>
          <section
            className="atelier-hero atelier-hero--mobile"
            aria-labelledby="mobile-title"
          >
            <p className="chapter">
              <em>01</em> CONNECT
            </p>
            <h1 id="mobile-title">接続</h1>
            <p className="lede">カードを選ぶと、モック接続になります。</p>
          </section>
          <StageStrip current="CONNECT" />
          <DemoBanner />
          <p className="connection-count mobile-count">
            {connectedCount}/4 デモ接続
          </p>
          <div className="market-grid market-grid--mobile">
            {SERVICES.map((service) => (
              <MarketCard
                identity={identityFor(service.id)}
                key={service.id}
                onConnect={() => {
                  void connect(service.id);
                }}
                onDisconnect={() => {
                  onDisconnect(service.id);
                }}
                serviceId={service.id}
                status={statusFor(service.id)}
                warning={warningFor(service.id)}
              />
            ))}
          </div>
        </div>
        <div className="mobile-bottom-dock">
          <div className="atelier-dock">
            <div>
              <strong>
                {allConnected ? "デモ準備完了" : `あと${4 - connectedCount}つ`}
              </strong>
              <span>
                {allConnected
                  ? "モックのエディタを開けます"
                  : "カード、または一括デモ"}
              </span>
            </div>
            <button
              className="atelier-btn atelier-btn--solid"
              disabled={startingDemo}
              onClick={() => {
                if (allConnected) {
                  router.push("/editor");
                  return;
                }
                void startDemo();
              }}
              type="button"
            >
              {allConnected ? "エディタを開く" : "デモを開始"}
            </button>
          </div>
        </div>
      </KonstaPage>
    </KonstaApp>
  );
};
