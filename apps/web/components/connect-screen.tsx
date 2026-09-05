"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import {
  connectHeading,
  connectIdentity,
  connectLead,
  connectTagClass,
  connectTagText,
  nextBody,
  nextKicker,
  nextTitle,
} from "../lib/preview-ui";
import { SERVICES } from "../lib/services";
import type { ServiceId } from "../lib/services";
import { BrandMark } from "./brand-mark";
import { MobileNav } from "./mobile-nav";
import { NeedSession } from "./need-session";
import { StackChrome } from "./stack-chrome";
import { Toast } from "./toast";

const ServiceCard = ({
  id,
  onConnect,
  onDisconnect,
}: {
  id: ServiceId;
  onConnect: (key?: string) => void;
  onDisconnect: () => void;
}) => {
  const { cancelConnect, state } = useMockApp();
  const service = SERVICES.find((item) => item.id === id);
  const row = state.connections[id];
  const [key, setKey] = useState(state.openaiKey);
  if (!service) {
    return null;
  }
  const failed = state.failed === id || row.status === "failed";
  const busy = row.status === "connecting";
  const on = row.status === "connected";
  const tagClass = connectTagClass(on, busy, failed);
  const tagText = connectTagText(on, busy, failed);
  const next = !(on || busy);
  return (
    <article
      className={`service-card${next ? " is-next" : ""}${failed ? " is-fail" : ""}`}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <BrandMark alt="" size={32} src={service.logo} />
        <span className={`${tagClass}${busy ? " ticker" : ""}`}>{tagText}</span>
      </div>
      <div>
        <div className="card-title">{service.label}</div>
        <p
          className="card-body"
          style={failed ? { color: "var(--color-accent-2-700)" } : undefined}
        >
          {failed ? "認可が拒否されました（access_denied）" : service.body}
        </p>
      </div>
      {id === "openai" && !on ? (
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
      <div
        style={{
          alignItems: "center",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ color: "var(--color-neutral-600)", fontSize: 12 }}>
          {connectIdentity(on, busy, row.identity)}
        </span>
        {on ? (
          <button
            className="btn btn-ghost"
            onClick={onDisconnect}
            type="button"
          >
            切断
          </button>
        ) : null}
        {busy ? (
          <button
            className="btn btn-ghost"
            onClick={cancelConnect}
            type="button"
          >
            やめる
          </button>
        ) : null}
        {on || busy ? null : (
          <button
            className="btn btn-primary"
            onClick={() => onConnect(id === "openai" ? key : undefined)}
            type="button"
          >
            {failed ? "もう一度" : service.cta}
          </button>
        )}
      </div>
    </article>
  );
};

export const ConnectScreen = () => {
  const app = useMockApp();
  const router = useRouter();
  const ready = app.allConnected;
  const count = app.connectedCount;
  const { failed } = app.state;
  const missing = SERVICES.find(
    (item) => app.state.connections[item.id].status !== "connected"
  );
  const failedService = SERVICES.find((item) => item.id === failed);

  if (app.hydrated && !app.state.session) {
    return <NeedSession />;
  }

  const goProjects = () => {
    if (ready) {
      router.push("/projects");
      return;
    }
    app.toast(`あと${4 - count}つつなぐと進めます`);
  };

  return (
    <main className={`stack ${fontVariables}`}>
      <div className="desk">
        <StackChrome current="connect" />
        <section className="connect">
          <div>
            {app.state.banner ? (
              <div className="banner card">
                <span className="tag tag-accent-2">切断</span>
                <span style={{ flex: 1 }}>{app.state.banner.text}</span>
              </div>
            ) : null}
            <div>
              <h1>{connectHeading(count, ready, Boolean(app.state.banner))}</h1>
              <p className="lede">
                {connectLead(
                  ready,
                  Boolean(failed),
                  count,
                  failedService?.label ?? ""
                )}
              </p>
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  fontSize: 13,
                  justifyContent: "space-between",
                }}
              >
                <span>準備の進捗</span>
                <span style={{ color: "var(--color-accent-700)" }}>
                  {count} / 4
                </span>
              </div>
              <div className="bar" aria-hidden="true">
                <i style={{ width: `${(count / 4) * 100}%` }} />
              </div>
            </div>
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
          <aside className={`next-card${failed ? " is-fail" : ""}`}>
            <span className="card-kicker">
              {nextKicker(ready, Boolean(failed))}
            </span>
            <div className="card-title">
              {nextTitle(
                ready,
                Boolean(failed),
                failedService?.label ?? "",
                missing?.label ?? ""
              )}
            </div>
            <p className="card-body">
              {nextBody(ready, Boolean(failed), missing?.body ?? "")}
            </p>
            <button
              className="btn btn-primary btn-block"
              onClick={goProjects}
              style={{ opacity: ready ? 1 : 0.45 }}
              type="button"
            >
              {app.state.banner ? "セッションに戻る" : "プロジェクトへ進む"}
            </button>
            <div
              style={{
                color: "var(--color-neutral-700)",
                display: "grid",
                fontSize: 13,
                gap: 10,
              }}
            >
              <span
                className="kicker"
                style={{ color: "var(--color-neutral-600)" }}
              >
                ログイン
              </span>
              <span
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <span>Google</span>
                <span>{app.state.session?.email ?? "michito@gmail.com"}</span>
              </span>
              <button
                className="btn btn-ghost"
                onClick={app.signOut}
                style={{ justifyContent: "flex-start", padding: 0 }}
                type="button"
              >
                ログアウト
              </button>
            </div>
          </aside>
        </section>
      </div>
      <div className="hand">
        <section className="hand-page">
          <p className="kicker">接続 {count}/4</p>
          <h1>{connectHeading(count, ready, Boolean(app.state.banner))}</h1>
          {app.state.banner ? (
            <p className="banner card">{app.state.banner.text}</p>
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
            className="btn btn-primary btn-block"
            onClick={goProjects}
            style={{ opacity: ready ? 1 : 0.45 }}
            type="button"
          >
            プロジェクトへ進む
          </button>
        </section>
        <MobileNav current="connect" />
      </div>
      {app.state.connecting && app.state.connecting !== "openai" ? (
        <div className="dialog-back">
          <div
            className="dialog"
            style={{ alignItems: "center", textAlign: "center" }}
          >
            <BrandMark
              alt=""
              size={40}
              src={
                SERVICES.find((item) => item.id === app.state.connecting)
                  ?.logo ?? ""
              }
            />
            <h2 className="dialog-title">
              {SERVICES.find((item) => item.id === app.state.connecting)?.label}{" "}
              で認可
            </h2>
            <p className="lede">
              別ウィンドウでアカウントを選ぶと、ここに戻ってきます。
            </p>
            <div className="dialog-actions">
              <button
                className="btn btn-secondary"
                onClick={() => app.finishConnect(false)}
                type="button"
              >
                拒否された（失敗を試す）
              </button>
              <button
                className="btn btn-primary"
                onClick={() => app.finishConnect(true)}
                type="button"
              >
                許可した
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Toast />
    </main>
  );
};
