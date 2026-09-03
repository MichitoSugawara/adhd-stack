"use client";

import { Button, Flow } from "@cloudflare/kumo";
import { ArrowRightIcon, CheckIcon, StackIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { connectFontVariables } from "../lib/connect-fonts";
import { SERVICES, STATUS_LABELS } from "../lib/services";
import type { useConnectBoard } from "../lib/use-connect-board";
import { ChatgptDevicePanel } from "./chatgpt-device-panel";

interface DesktopConnectScreenProperties {
  board: ReturnType<typeof useConnectBoard>;
}

export const DesktopConnectScreen = ({
  board,
}: DesktopConnectScreenProperties) => {
  const router = useRouter();
  const {
    allConnected,
    authenticated,
    cancelChatgptDevice,
    chatgptDevice,
    configured,
    connect,
    connectedCount,
    identityFor,
    oauthError,
    onDisconnect,
    openChatgptDevice,
    signOut,
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
        {authenticated ? (
          <Button
            onClick={() => {
              void signOut();
            }}
            variant="ghost"
          >
            ログアウト
          </Button>
        ) : null}
      </header>
      <section className="connection-page" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">CONNECT ONCE. BUILD ANYTHING.</p>
          <h1 id="hero-title">何も考えずに、始める。</h1>
          <p>つなぐだけで、開発から公開まで。</p>
        </div>
        {oauthError ? (
          <p className="oauth-error" role="alert">
            {oauthError}
          </p>
        ) : null}
        {chatgptDevice ? (
          <ChatgptDevicePanel
            device={chatgptDevice}
            onCancel={cancelChatgptDevice}
            onOpen={openChatgptDevice}
          />
        ) : null}
        <div className="flow-shell">
          <div className="flow-heading">
            <div>
              <p className="flow-title">接続</p>
              <p className="flow-description">
                4つそろうと、エディタを開けます。
              </p>
            </div>
            <span className="connection-count">
              {connectedCount}/4 接続済み
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
                const isConfigured = configured?.[service.id] ?? false;
                const waitingChatgpt =
                  service.id === "chatgpt" && Boolean(chatgptDevice);
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
                    接続する
                  </Button>
                );
                if (status === "connected") {
                  nodeAction = (
                    <Button
                      aria-label={`${service.label}を切断`}
                      className="node-action node-action--connected"
                      onClick={() => {
                        void onDisconnect(service.id);
                      }}
                      shape="circle"
                      size="sm"
                      title={`${service.label}を切断`}
                      variant="ghost"
                    >
                      <CheckIcon size={14} weight="bold" />
                    </Button>
                  );
                } else if (waitingChatgpt) {
                  nodeAction = (
                    <Button
                      className="node-action"
                      onClick={cancelChatgptDevice}
                      size="sm"
                      variant="ghost"
                    >
                      やめる
                    </Button>
                  );
                }
                return (
                  <Flow.Node
                    id={service.id}
                    key={service.id}
                    render={
                      <div className={`service-node service-node--${status}`}>
                        <div className="service-main">
                          <span className="service-icon" aria-hidden="true">
                            <Image
                              alt=""
                              className="service-logo-image"
                              height={26}
                              src={service.logo}
                              width={26}
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
                            {status === "disconnected" && !isConfigured ? (
                              <span className="service-identity">
                                OAuth アプリ未設定
                              </span>
                            ) : null}
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
