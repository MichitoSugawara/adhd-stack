"use client";

import { useRouter } from "next/navigation";

import { connectFontVariables } from "../lib/connect-fonts";
import { SERVICES } from "../lib/services";
import type { useConnectBoard } from "../lib/use-connect-board";
import { AtelierNav } from "./atelier-nav";
import { DemoBanner } from "./demo-banner";
import { MarketCard } from "./market-card";
import { StageStrip } from "./stage-strip";

interface DesktopConnectScreenProperties {
  board: ReturnType<typeof useConnectBoard>;
}

export const DesktopConnectScreen = ({
  board,
}: DesktopConnectScreenProperties) => {
  const router = useRouter();
  const {
    allConnected,
    connect,
    connectedCount,
    identityFor,
    onDisconnect,
    resetDemo,
    startDemo,
    startingDemo,
    statusFor,
    warningFor,
  } = board;

  return (
    <main className={`atelier desktop-experience ${connectFontVariables}`}>
      <AtelierNav
        onReset={resetDemo}
        onStart={() => {
          void startDemo();
        }}
        starting={startingDemo}
      />
      <section className="atelier-hero" aria-labelledby="hero-title">
        <p className="chapter">
          <em>01</em> CONNECT
        </p>
        <h1 id="hero-title">
          何も考えずに、
          <br />
          <span>始める。</span>
        </h1>
        <p className="lede">
          つなぐだけで、開発から公開まで。カードはカタログです。ノード図ではありません。
        </p>
        <StageStrip current="CONNECT" />
        <DemoBanner />
      </section>
      <section className="market-board" aria-label="接続カタログ">
        <header className="market-head">
          <div>
            <p className="flow-title">Marketplace</p>
            <p className="flow-description">
              4つそろうと、モックのエディタを開けます。
            </p>
          </div>
          <span className="connection-count">{connectedCount}/4 デモ接続</span>
        </header>
        <div className="market-grid">
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
        <footer className="market-foot">
          <button
            className="atelier-btn atelier-btn--solid"
            disabled={!allConnected}
            onClick={() => router.push("/editor")}
            type="button"
          >
            {allConnected ? "エディタを開く" : "4つつながると開きます"}
          </button>
        </footer>
      </section>
    </main>
  );
};
