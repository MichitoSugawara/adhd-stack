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
import { SERVICES, STATUS_LABELS } from "../lib/services";
import type { useConnectBoard } from "../lib/use-connect-board";
import { ChatgptDevicePanel } from "./chatgpt-device-panel";

interface MobileConnectScreenProperties {
  board: ReturnType<typeof useConnectBoard>;
}

export const MobileConnectScreen = ({
  board,
}: MobileConnectScreenProperties) => {
  const router = useRouter();
  const {
    allConnected,
    cancelChatgptDevice,
    chatgptDevice,
    connect,
    connectedCount,
    identityFor,
    oauthError,
    onDisconnect,
    openChatgptDevice,
    statusFor,
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
            <p>STEP 1 OF 1</p>
            <h1 id="mobile-title">接続</h1>
            <span>必要なサービスをつなげば、すぐ始められます。</span>
          </section>
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
          <div className="mobile-node-grid">
            {SERVICES.map((service) => {
              const status = statusFor(service.id);
              const isConnected = status === "connected";
              let identityLabel = "タップして接続";
              if (service.id === "chatgpt" && chatgptDevice) {
                identityLabel = "確認待ち";
              } else if (isConnected) {
                identityLabel = identityFor(service.id);
              }
              const canCancelChatgpt =
                service.id === "chatgpt" && Boolean(chatgptDevice);
              let actionLabel = "接続する";
              if (isConnected) {
                actionLabel = "切断する";
              } else if (canCancelChatgpt) {
                actionLabel = "やめる";
              }
              return (
                <button
                  aria-label={`${service.label}: ${STATUS_LABELS[status]}. ${actionLabel}`}
                  className="mobile-card-button"
                  disabled={status === "connecting" && !canCancelChatgpt}
                  key={service.id}
                  onClick={() => {
                    if (isConnected) {
                      void onDisconnect(service.id);
                      return;
                    }
                    if (canCancelChatgpt) {
                      cancelChatgptDevice();
                      return;
                    }
                    void connect(service.id);
                  }}
                  type="button"
                >
                  <KonstaGlass
                    className={`mobile-service-card mobile-service-card--${status}`}
                  >
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
                      {status === "connecting"
                        ? "接続しています…"
                        : STATUS_LABELS[status]}
                    </span>
                    <span className="mobile-service-identity">
                      {identityLabel}
                    </span>
                  </KonstaGlass>
                </button>
              );
            })}
          </div>
          <section className="mobile-progress" aria-label="接続の進捗">
            <div>
              <span>準備の進捗</span>
              <strong>{connectedCount}/4</strong>
            </div>
            <KonstaProgressbar progress={connectedCount / SERVICES.length} />
          </section>
        </div>
        <div className="mobile-bottom-dock">
          <KonstaGlass className="mobile-glass-bar">
            <div>
              <strong>
                {allConnected ? "準備完了" : `あと${4 - connectedCount}つ`}
              </strong>
              <span>
                {allConnected ? "エディタを開けます" : "カードをタップして接続"}
              </span>
            </div>
            <KonstaButton
              aria-label="エディタを開く"
              className="mobile-primary-action"
              disabled={!allConnected}
              onClick={() => router.push("/editor")}
              rounded
            >
              エディタを開く
            </KonstaButton>
          </KonstaGlass>
        </div>
      </KonstaPage>
    </KonstaApp>
  );
};
