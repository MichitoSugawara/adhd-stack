"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import { SERVICES } from "../lib/services";
import type { ServiceId } from "../lib/services";
import { BrandMark } from "./brand-mark";
import { MobileNav } from "./mobile-nav";
import { NeedSession } from "./need-session";
import { StackChrome } from "./stack-chrome";

const STATUS_COPY = {
  connected: "つながった",
  connecting: "確認中",
  disconnected: "未接続",
  failed: "失敗",
} as const;

const ServiceCard = ({
  id,
  onConnect,
  onDisconnect,
}: {
  id: ServiceId;
  onConnect: (key?: string) => void;
  onDisconnect: () => void;
}) => {
  const { state } = useMockApp();
  const service = SERVICES.find((item) => item.id === id);
  const row = state.connections[id];
  const [key, setKey] = useState(state.openaiKey);
  if (!service) {
    return null;
  }
  return (
    <article className="service-card">
      <span className="chip">{service.category}</span>
      <BrandMark alt="" size={36} src={service.logo} />
      <h2>{service.label}</h2>
      <p className={`status status-${row.status}`}>
        <i aria-hidden="true" />
        {STATUS_COPY[row.status]}
        {row.identity === "未選択" ? "" : ` · ${row.identity}`}
      </p>
      {row.error ? <p className="lede">{row.error}</p> : null}
      {id === "openai" && row.status !== "connected" ? (
        <label>
          <span className="sr-only">APIキー</span>
          <input
            autoComplete="off"
            onChange={(event) => setKey(event.target.value)}
            placeholder="sk-...（デモ。failfail で失敗）"
            value={key}
          />
        </label>
      ) : null}
      {row.status === "connected" ? (
        <button className="btn btn-danger" onClick={onDisconnect} type="button">
          外す
        </button>
      ) : (
        <button
          className="btn btn-solid"
          disabled={row.status === "connecting"}
          onClick={() => onConnect(id === "openai" ? key : undefined)}
          type="button"
        >
          {id === "openai" ? "キーを入れる" : "つなぐ"}
        </button>
      )}
    </article>
  );
};

export const ConnectScreen = () => {
  const app = useMockApp();
  const router = useRouter();

  if (app.hydrated && !app.state.session) {
    return <NeedSession />;
  }

  return (
    <main className={`stack ${fontVariables}`}>
      <div className="desk">
        <StackChrome progress={`${app.connectedCount}/4`} />
        {app.state.banner ? (
          <p className="banner" role="status">
            {app.state.banner.text}
            <button
              className="btn btn-ghost"
              onClick={app.clearBanner}
              type="button"
            >
              閉じる
            </button>
          </p>
        ) : null}
        <section className="connect">
          <div>
            <p className="kicker">接続</p>
            <h1>4つつなぐ</h1>
            <p className="lede">
              OpenAI は APIキー。ほかはつなぐだけ。実サービスには届きません。
            </p>
            <div className="connect-grid">
              {SERVICES.map((service) => (
                <ServiceCard
                  id={service.id}
                  key={service.id}
                  onConnect={(key) => {
                    void app.connectService(service.id, key);
                  }}
                  onDisconnect={() => app.disconnectService(service.id)}
                />
              ))}
            </div>
          </div>
          <aside className="next-card">
            <p className="kicker">次</p>
            <h2>一覧へ</h2>
            <p className="lede">
              {app.allConnected
                ? "そろいました。プロジェクトを開けます。"
                : `あと${4 - app.connectedCount}つ。`}
            </p>
            <ol className="lede next-steps">
              <li>会話の鍵</li>
              <li>ソース置き場</li>
              <li>公開先</li>
              <li>データ</li>
            </ol>
            <button
              className="btn btn-solid"
              disabled={!app.allConnected}
              onClick={() => router.push("/projects")}
              type="button"
            >
              {app.allConnected ? "一覧へ" : "4つそろうと進む"}
            </button>
          </aside>
        </section>
      </div>
      <div className="hand">
        <section className="hand-page">
          <p className="kicker">接続 {app.connectedCount}/4</p>
          <h1>4つつなぐ</h1>
          {app.state.banner ? (
            <p className="banner">{app.state.banner.text}</p>
          ) : null}
          <div className="connect-grid connect-grid-hand">
            {SERVICES.map((service) => (
              <ServiceCard
                id={service.id}
                key={service.id}
                onConnect={(key) => {
                  void app.connectService(service.id, key);
                }}
                onDisconnect={() => app.disconnectService(service.id)}
              />
            ))}
          </div>
          <button
            className="btn btn-solid"
            disabled={!app.allConnected}
            onClick={() => router.push("/projects")}
            type="button"
          >
            {app.allConnected ? "一覧へ" : "4つそろうと進む"}
          </button>
        </section>
        <MobileNav current="connect" />
      </div>
    </main>
  );
};
