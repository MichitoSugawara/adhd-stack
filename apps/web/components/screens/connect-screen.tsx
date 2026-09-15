"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ChatgptDevicePanel } from "@/components/screens/chatgpt-device-panel";
import { ConnectServiceCard } from "@/components/screens/connect-service-card";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { connectErrorMessage, useConnectBanner } from "@/lib/connect-error";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import {
  clearPendingOc,
  readPendingOc,
  writePendingOc,
} from "@/lib/pending-oc";
import type { ServiceId } from "@/lib/services";
import { SERVICES } from "@/lib/services";
import { enterShell } from "@/lib/shell-state";

interface DeviceSession {
  deviceAuthId: string;
  intervalSeconds: number;
  startedAt: number;
  userCode: string;
  verificationUrl: string;
}

interface PendingOc {
  connectionName: string;
  service: "convex" | "github";
}

const ctaLabelFor = (
  boardReady: boolean,
  busy: ServiceId | null,
  id: ServiceId
): string => {
  if (!boardReady) {
    return "確認中…";
  }
  if (busy === id) {
    return "接続中…";
  }
  return "つなぐ";
};

const ConnectBoard = () => {
  const router = useRouter();
  const {
    beginConnect,
    beginDevice,
    board,
    confirmOc,
    disconnect,
    pollDevice,
    refresh,
    signInWithTicket,
  } = useConnectionsPort();
  const banner = useConnectBanner();
  const [errors, setErrors] = useState<Partial<Record<ServiceId, string>>>({});
  const [busy, setBusy] = useState<ServiceId | null>(null);
  const [device, setDevice] = useState<DeviceSession | null>(null);
  const [pendingOc, setPendingOc] = useState<PendingOc | null>(null);

  const configured = board?.configured;
  const connectedCount = (board?.connections ?? []).filter(
    (row) => row.status === "connected"
  ).length;

  useEffect(() => {
    if (!device) {
      return;
    }
    let cancelled = false;
    const tick = async () => {
      try {
        const result = await pollDevice({
          deviceAuthId: device.deviceAuthId,
          startedAt: device.startedAt,
          userCode: device.userCode,
        });
        if (cancelled || result.status === "pending") {
          return;
        }
        if (result.ticket) {
          await signInWithTicket(result.ticket);
        }
        enterShell();
        setDevice(null);
        setBusy(null);
        refresh();
      } catch (error) {
        if (!cancelled) {
          setErrors((current) => ({
            ...current,
            chatgpt: connectErrorMessage(error),
          }));
          setDevice(null);
          setBusy(null);
        }
      }
    };
    const waitMs = Math.max(2000, device.intervalSeconds * 1000);
    const timer = window.setInterval(() => {
      void tick();
    }, waitMs);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [device, pollDevice, refresh, signInWithTicket]);

  useEffect(() => {
    if (!pendingOc) {
      return;
    }
    let cancelled = false;
    let timer = 0;
    const confirm = async () => {
      try {
        const result = await confirmOc(pendingOc);
        if (cancelled || result.status === "pending") {
          return false;
        }
        if (result.status === "authorized") {
          await signInWithTicket(result.ticket);
        }
        clearPendingOc();
        enterShell();
        setPendingOc(null);
        setBusy(null);
        refresh();
        return true;
      } catch (error) {
        if (!cancelled) {
          clearPendingOc();
          setErrors((current) => ({
            ...current,
            [pendingOc.service]: connectErrorMessage(error),
          }));
          setPendingOc(null);
          setBusy(null);
        }
        return true;
      }
    };
    const loop = async () => {
      const done = await confirm();
      if (done) {
        window.clearInterval(timer);
      }
    };
    timer = window.setInterval(() => {
      void loop();
    }, 2500);
    void loop();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [confirmOc, pendingOc, refresh, signInWithTicket]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oc = params.get("oc");
    if (oc === "github" || oc === "convex") {
      return;
    }
    setPendingOc((current) => current ?? readPendingOc());
  }, []);

  const startConnect = async (id: ServiceId) => {
    setErrors((current) => ({ ...current, [id]: undefined }));
    setBusy(id);
    try {
      if (id === "chatgpt") {
        const started = await beginDevice();
        setDevice({
          deviceAuthId: started.deviceAuthId,
          intervalSeconds: started.intervalSeconds,
          startedAt: Date.now(),
          userCode: started.userCode,
          verificationUrl: started.verificationUrl,
        });
        window.open(started.verificationUrl, "_blank");
        return;
      }
      const started = await beginConnect({ provider: id });
      if (
        started.kind === "catalog" &&
        started.connectionName &&
        (id === "github" || id === "convex")
      ) {
        writePendingOc({
          connectionName: started.connectionName,
          service: id,
        });
      }
      // 同一タブだけ。ポップアップの null 判定で同じ URL を二度開かない。
      window.location.assign(started.url);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [id]: connectErrorMessage(error),
      }));
      setBusy(null);
    }
  };

  const startDisconnect = async (id: ServiceId) => {
    setBusy(id);
    try {
      await disconnect({ provider: id });
      refresh();
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [id]: connectErrorMessage(error),
      }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <p className="text-ink-2 mt-2 text-[14px] leading-6">
        つながったように見せません。未設定なら押せません。
      </p>
      {banner ? <p className="shell-note mt-4 max-w-3xl">{banner}</p> : null}
      <p className="shell-note mt-4 max-w-3xl">
        {connectedCount} / 4 接続。ChatGPT
        は画面のコード、ほかはつなぐボタンです。
      </p>
      <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
        {SERVICES.map((service) => {
          const connection = board?.connections.find(
            (row) => row.provider === service.id
          );
          let extra = null;
          if (service.id === "chatgpt" && device) {
            extra = (
              <ChatgptDevicePanel
                busy={busy === "chatgpt"}
                onCancel={() => {
                  setDevice(null);
                  setBusy(null);
                }}
                userCode={device.userCode}
                verificationUrl={device.verificationUrl}
              />
            );
          } else if (service.id === pendingOc?.service) {
            extra = (
              <p className="text-ink-3 mt-3 text-[12px]">
                認可が終わるとこの画面に戻ります。
              </p>
            );
          }
          return (
            <ConnectServiceCard
              configured={configured?.[service.id] ?? true}
              connection={connection}
              ctaDisabled={busy !== null || board === undefined}
              ctaLabel={ctaLabelFor(board !== undefined, busy, service.id)}
              error={errors[service.id]}
              extra={extra}
              key={service.id}
              onConnect={() => {
                void startConnect(service.id);
              }}
              onDisconnect={() => {
                void startDisconnect(service.id);
              }}
              service={service}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-control bg-ink text-surface h-10 px-4 text-[13px] font-medium"
          onClick={() => {
            router.push("/projects");
          }}
          type="button"
        >
          {board?.allConnected ? "一覧へ" : "一覧の骨格を見る"}
        </button>
        <p className="text-ink-3 self-center text-[13px]">
          {board?.allConnected
            ? "4つそろいました。"
            : "未接続のまま、一覧の骨格を見ます。作成は接続が揃ってからです。"}
        </p>
      </div>
    </>
  );
};

const noop = (): void => {
  // Offline cards have no live connection actions.
};

const ConnectOffline = () => {
  const router = useRouter();
  return (
    <>
      <p className="text-ink-2 mt-2 text-[14px] leading-6">
        バックエンド URL が未設定です。つながったようには見せません。
      </p>
      <p className="shell-note mt-4 max-w-3xl">
        0 / 4 接続。接続ボタンは使えません。
      </p>
      <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
        {SERVICES.map((service) => (
          <ConnectServiceCard
            configured={false}
            ctaDisabled
            ctaLabel="つなぐ"
            key={service.id}
            onConnect={noop}
            onDisconnect={noop}
            service={service}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-control bg-ink text-surface h-10 px-4 text-[13px] font-medium"
          onClick={() => {
            router.push("/projects");
          }}
          type="button"
        >
          一覧の骨格を見る
        </button>
      </div>
    </>
  );
};

export const ConnectScreen = () => (
  <ShellGate>
    <AppFrame>
      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
            接続
          </p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
            4つをつなぎます
          </h1>
          {hasConvexUrl() ? <ConnectBoard /> : <ConnectOffline />}
        </div>
      </main>
    </AppFrame>
  </ShellGate>
);
