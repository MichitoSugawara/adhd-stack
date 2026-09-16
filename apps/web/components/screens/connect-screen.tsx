"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ChatgptDevicePanel } from "@/components/screens/chatgpt-device-panel";
import { ConnectServiceCard } from "@/components/screens/connect-service-card";
import { StatusChip } from "@/components/screens/status-chip";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import {
  boardChip,
  ctaLabelFor,
  nextDisconnected,
  nextHint,
  nextLabel,
} from "@/lib/connect-copy";
import { connectErrorMessage, useConnectBanner } from "@/lib/connect-error";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { useLastWorkspace } from "@/lib/last-workspace";
import { openOauthTab } from "@/lib/oauth-navigation";
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

const [chatgptService] = SERVICES;
const otherServices = SERVICES.filter((service) => service.id !== "chatgpt");

const ConnectNextStep = ({
  busy,
  onConnect,
  service,
}: {
  busy: boolean;
  onConnect: (id: ServiceId) => void;
  service: (typeof SERVICES)[number] | null;
}) => {
  if (!service) {
    return null;
  }
  return (
    <section className="rounded-card bg-accent-tint mt-6 max-w-4xl p-5 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_22%,transparent)]">
      <p className="text-accent-ink text-[12px] font-medium">次のステップ</p>
      <h2 className="mt-1 text-[20px] font-semibold">
        {service.label} をつなぐ
      </h2>
      <p className="text-ink-2 mt-2 text-[13px] leading-6">{service.body}</p>
      <button
        className="btn-accent rounded-control mt-4 h-10 px-4 text-[13px] font-medium disabled:opacity-40"
        disabled={busy}
        onClick={() => {
          onConnect(service.id);
        }}
        type="button"
      >
        つなぐ
      </button>
    </section>
  );
};

const ConnectProgress = ({ count }: { count: number }) => (
  <div className="mt-6 max-w-4xl">
    <div className="flex items-end justify-between gap-3">
      <p className="text-[18px] font-semibold tracking-tight">
        4つをつなぐと作成できます
      </p>
      <p className="text-ink-3 text-[13px] tabular-nums">{count} / 4</p>
    </div>
    <div className="bg-field mt-3 h-2 overflow-hidden rounded-full">
      <div
        className="bg-accent h-2 rounded-full transition-[width] duration-500"
        style={{ width: `${String((count / 4) * 100)}%` }}
      />
    </div>
    <p className="text-ink-3 mt-2 text-[13px]">
      途中でやめても、接続は残ります。
    </p>
  </div>
);

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
  const lastWorkspace = useLastWorkspace();
  const [errors, setErrors] = useState<Partial<Record<ServiceId, string>>>({});
  const [busy, setBusy] = useState<ServiceId | null>(null);
  const [device, setDevice] = useState<DeviceSession | null>(null);
  const [pendingOc, setPendingOc] = useState<PendingOc | null>(null);

  const configured = board?.configured;
  const connectedCount = (board?.connections ?? []).filter(
    (row) => row.status === "connected"
  ).length;
  const allConnected = Boolean(board?.allConnected);

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
        openOauthTab(started.verificationUrl);
        return;
      }
      const started = await beginConnect({ provider: id });
      if (
        started.kind === "catalog" &&
        started.connectionName &&
        (id === "github" || id === "convex")
      ) {
        const pending = {
          connectionName: started.connectionName,
          service: id,
        };
        writePendingOc(pending);
        setPendingOc(pending);
      }
      openOauthTab(started.url);
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

  const goNext = () => {
    if (allConnected && lastWorkspace) {
      router.push(lastWorkspace.path);
      return;
    }
    router.push("/projects");
  };

  const cardFor = (
    service: (typeof SERVICES)[number],
    featured: boolean,
    extra?: ReactNode
  ) => {
    const connection = board?.connections.find(
      (row) => row.provider === service.id
    );
    return (
      <ConnectServiceCard
        configured={configured?.[service.id] ?? true}
        connection={connection}
        ctaDisabled={busy !== null || board === undefined}
        ctaLabel={ctaLabelFor(
          board !== undefined,
          busy,
          service.id,
          device !== null
        )}
        error={errors[service.id]}
        extra={extra}
        featured={featured}
        key={service.id}
        onConnect={() => {
          void startConnect(service.id);
        }}
        onDisconnect={() => {
          void startDisconnect(service.id);
        }}
        service={service}
        waiting={service.id === "chatgpt" && device !== null}
      />
    );
  };

  const chatgptExtra = device ? (
    <ChatgptDevicePanel
      onCancel={() => {
        setDevice(null);
        setBusy(null);
      }}
      onOpen={() => {
        openOauthTab(device.verificationUrl);
      }}
      userCode={device.userCode}
    />
  ) : null;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-semibold tracking-tight">
              接続を準備
            </h1>
            <StatusChip tone={allConnected ? "ok" : "idle"}>
              {boardChip(allConnected)}
            </StatusChip>
          </div>
          <p className="text-ink-2 mt-2 text-[14px] leading-6">
            足りないものだけつなぎます。
          </p>
        </div>
        <button
          className="rounded-control bg-field text-ink h-10 px-4 text-[13px] font-medium"
          onClick={goNext}
          type="button"
        >
          {nextLabel(allConnected, lastWorkspace !== null)}
        </button>
      </div>
      {banner ? <p className="shell-note mt-4 max-w-4xl">{banner}</p> : null}
      <ConnectProgress count={connectedCount} />
      {allConnected ? null : (
        <ConnectNextStep
          busy={busy !== null || board === undefined}
          onConnect={(id) => {
            void startConnect(id);
          }}
          service={nextDisconnected(board?.connections)}
        />
      )}
      <div className="mt-6 flex max-w-4xl flex-col gap-3">
        {chatgptService ? cardFor(chatgptService, true, chatgptExtra) : null}
        <div className="grid gap-3 md:grid-cols-3">
          {otherServices.map((service) => {
            let extra: ReactNode;
            if (service.id === pendingOc?.service) {
              extra = (
                <p className="text-ink-3 mt-3 text-[12px]">
                  新しいタブで認可しています。終わったらこのタブに戻ってください。
                </p>
              );
            }
            return cardFor(service, false, extra);
          })}
        </div>
      </div>
      <p className="text-ink-3 mt-5 text-[13px]">
        {nextHint(allConnected, lastWorkspace)}
      </p>
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-semibold tracking-tight">
              接続を準備
            </h1>
            <StatusChip tone="idle">まだそろっていません</StatusChip>
          </div>
          <p className="text-ink-2 mt-2 text-[14px] leading-6">
            バックエンド URL が未設定です。つなぐボタンは使えません。
          </p>
        </div>
        <button
          className="rounded-control bg-field text-ink h-10 px-4 text-[13px] font-medium"
          onClick={() => {
            router.push("/projects");
          }}
          type="button"
        >
          あとで
        </button>
      </div>
      <ConnectProgress count={0} />
      <ConnectNextStep busy onConnect={noop} service={chatgptService ?? null} />
      <div className="mt-6 flex max-w-4xl flex-col gap-3">
        {chatgptService ? (
          <ConnectServiceCard
            configured={false}
            ctaDisabled
            ctaLabel="つなぐ"
            featured
            onConnect={noop}
            onDisconnect={noop}
            service={chatgptService}
          />
        ) : null}
        <div className="grid gap-3 md:grid-cols-3">
          {otherServices.map((service) => (
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
      </div>
    </>
  );
};

export const ConnectScreen = () => (
  <ShellGate>
    <AppFrame>
      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6 lg:px-10">
        <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
          接続
        </p>
        {hasConvexUrl() ? <ConnectBoard /> : <ConnectOffline />}
      </main>
    </AppFrame>
  </ShellGate>
);
