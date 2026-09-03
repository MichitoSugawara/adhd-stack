"use client";

import { Button, Flow } from "@cloudflare/kumo";
import { ArrowRightIcon, CheckIcon, StackIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { connectFontVariables } from "../lib/connect-fonts";
import { SERVICE_META } from "../lib/mock-copy";
import { SERVICES, STATUS_LABELS } from "../lib/services";
import type { useConnectBoard } from "../lib/use-connect-board";
import { DemoBanner } from "./demo-banner";
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
    <main className={`app-shell desktop-experience ${connectFontVariables}`}>
      <header className="product-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <StackIcon size={19} weight="bold" />
          </span>
          <span>ADHD Stack</span>
        </div>
        <div className="header-actions">
          <Button
            onClick={() => router.push("/projects")}
            size="sm"
            variant="ghost"
          >
            プロジェクト
          </Button>
          <Button
            loading={startingDemo}
            onClick={() => {
              void startDemo();
            }}
            size="sm"
            variant="secondary"
          >
            デモを開始
          </Button>
          <Button onClick={resetDemo} size="sm" variant="ghost">
            デモをリセット
          </Button>
        </div>
      </header>
      <section className="connection-page" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">01 · CONNECT</p>
          <h1 id="hero-title">何も考えずに、始める。</h1>
          <p>つなぐだけで、開発から公開まで。全部モックです。</p>
        </div>
        <StageStrip current="CONNECT" />
        <DemoBanner />
        <div className="flow-shell">
          <div className="flow-heading">
            <div>
              <p className="flow-title">接続（デモ）</p>
              <p className="flow-description">
                4つそろうと、モックのエディタを開けます。
              </p>
            </div>
            <span className="connection-count">
              {connectedCount}/4 デモ接続
            </span>
          </div>
          <Flow
            align="center"
            className="connection-flow"
            orientation="vertical"
            padding={{ x: 28, y: 38 }}
          >
            <Flow.Parallel>
              {SERVICES.map((service) => {
                const status = statusFor(service.id);
                const meta = SERVICE_META[service.id];
                let nodeAction = (
                  <Button
                    className="node-action"
                    loading={status === "connecting"}
                    onClick={() => {
                      void connect(service.id);
                    }}
                    size="sm"
                    variant="secondary"
                  >
                    デモ接続
                  </Button>
                );
                if (status === "connected") {
                  nodeAction = (
                    <Button
                      aria-label={`${service.label}のデモ接続を外す`}
                      className="node-action node-action--connected"
                      onClick={() => {
                        onDisconnect(service.id);
                      }}
                      shape="circle"
                      size="sm"
                      title={`${service.label}のデモ接続を外す`}
                      variant="ghost"
                    >
                      <CheckIcon size={14} weight="bold" />
                    </Button>
                  );
                }
                return (
                  <Flow.Node
                    id={service.id}
                    key={service.id}
                    render={
                      <div className={`service-node service-node--${status}`}>
                        <span className="card-chip">{service.category}</span>
                        <div className="service-main">
                          <span className="service-icon" aria-hidden="true">
                            <Image
                              alt=""
                              className="service-logo-image"
                              height={32}
                              src={service.logo}
                              width={32}
                            />
                          </span>
                          <span>
                            <strong>{service.label}</strong>
                            <span className="service-identity">
                              {identityFor(service.id)}
                            </span>
                            <span className={`status status--${status}`}>
                              <i aria-hidden="true" />
                              {STATUS_LABELS[status]}
                            </span>
                            {warningFor(service.id) ? (
                              <span className="service-identity">
                                {warningFor(service.id)}
                              </span>
                            ) : null}
                            <span className="service-meta">{meta.target}</span>
                          </span>
                        </div>
                        {nodeAction}
                      </div>
                    }
                  />
                );
              })}
            </Flow.Parallel>
            <Flow.Node
              disabled={!allConnected}
              id="editor"
              render={
                <li className={`editor-node ${allConnected ? "is-ready" : ""}`}>
                  <div>
                    <span className="editor-label">NEXT</span>
                    <strong>エディタ</strong>
                  </div>
                  {allConnected ? (
                    <Button
                      onClick={() => router.push("/editor")}
                      variant="primary"
                    >
                      エディタを開く
                    </Button>
                  ) : (
                    <Button
                      aria-label="エディタへ"
                      disabled
                      icon={ArrowRightIcon}
                      shape="circle"
                      title="4つつながると開けます"
                      variant="primary"
                    />
                  )}
                </li>
              }
            />
          </Flow>
        </div>
      </section>
    </main>
  );
};
