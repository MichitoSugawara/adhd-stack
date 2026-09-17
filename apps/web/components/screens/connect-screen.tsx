"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useReducer, useState } from "react";
import type { ReactNode } from "react";

import { ChatgptDevicePanel } from "@/components/screens/chatgpt-device-panel";
import { ConnectServiceCard } from "@/components/screens/connect-service-card";
import { AppFrame } from "@/components/shell/app-frame";
import { OnboardingJourney } from "@/components/shell/onboarding-journey";
import { ShellGate } from "@/components/shell/shell-gate";
import { useWorkspaceList } from "@/lib/coding-port";
import {
  ctaLabelFor,
  nextDisconnected,
  nextHint as hintForBoard,
  nextLabel,
} from "@/lib/connect-copy";
import { connectErrorMessage, useConnectBanner } from "@/lib/connect-error";
import {
  clearConnectionReturn,
  useConnectionReturn,
} from "@/lib/connection-return";
import { useConnectionsPort } from "@/lib/connections-port";
import type { BoardConnection } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import {
  destinationAfterConnect,
  markFirstActivationConsumed,
} from "@/lib/first-activation";
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
import { useFirstCreateAdvance } from "@/lib/use-first-create-advance";

import "./connections.css";

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

const PendingAuthorization = ({ onCancel }: { onCancel: () => void }) => (
  <div className="connection-authorization">
    <p role="status">
      別のタブで認可を進めてください。終わったら、この画面に戻ります。
    </p>
    <button
      className="ui-button connection-button-quiet"
      onClick={onCancel}
      type="button"
    >
      いったん中止してやり直す
    </button>
  </div>
);

// The setup journey follows Circle's restrained list hierarchy and Beautiful UI's progressive disclosure.
const ConnectHeading = () => (
  <>
    <OnboardingJourney current={1} />
    <header className="connection-heading">
      <p className="ui-eyebrow">YOUR OWN WORKSPACE</p>
      <h1>つくる準備を、ここで。</h1>
      <p>
        いつものアカウントをつなぐだけ。
        <br className="connection-mobile-break" />
        つくることから、公開まで。
      </p>
    </header>
  </>
);

const progressLabel = (count: number, loading: boolean): string => {
  if (loading) {
    return "接続を確認しています";
  }
  return count === 4 ? "準備が整いました" : "4つのアカウントをつなぐ";
};

const ConnectProgress = ({
  count,
  loading = false,
}: {
  count: number;
  loading?: boolean;
}) => (
  <div className="connection-progress">
    <div className="connection-progress-label">
      <p>{progressLabel(count, loading)}</p>
      <span aria-live="polite">
        <strong>{count}</strong> / 4
      </span>
    </div>
    <progress aria-label="接続済みアカウント数" max={4} value={count} />
    <p>
      {count === 4
        ? "さっそく、最初のアイデアを形にしましょう。"
        : "接続したアカウントは保存されます。続きはいつでも。"}
    </p>
  </div>
);

type ConnectionActivity = { native: boolean; service: ServiceId } | null;
type ConnectionActivityAction =
  | { type: "finish" }
  | { service: ServiceId; type: "native" | "start" };

const connectionActivityReducer = (
  _activity: ConnectionActivity,
  action: ConnectionActivityAction
): ConnectionActivity => {
  if (action.type === "finish") {
    return null;
  }
  return { native: action.type === "native", service: action.service };
};

const useConnectionActivity = (
  connections: readonly BoardConnection[] | undefined
) => {
  const [activity, dispatchActivity] = useReducer(
    connectionActivityReducer,
    null
  );
  useEffect(() => {
    if (
      activity?.native &&
      connections?.some(
        (connection) =>
          connection.provider === activity.service &&
          connection.status === "connected"
      )
    ) {
      dispatchActivity({ type: "finish" });
    }
  }, [activity, connections]);
  return {
    busy: activity?.service ?? null,
    dispatchActivity,
    pendingNative: activity?.native ? activity.service : null,
  };
};

const ConnectionFooter = ({
  allConnected,
  busy,
  nextHint,
  onNext,
  onResume,
  resumeWorkspace,
}: {
  allConnected: boolean;
  busy: boolean;
  nextHint: string;
  onNext: () => void;
  onResume?: () => void;
  resumeWorkspace: boolean;
}) => (
  <div className="connection-footer">
    <div>
      <p className="connection-footer-title">
        {allConnected
          ? "あなたの準備ができました。"
          : "一度つなげば、次からはすぐに。"}
      </p>
      <p>{nextHint}</p>
      {onResume ? (
        <button
          className="connection-resume"
          disabled={!allConnected || busy}
          onClick={onResume}
          type="button"
        >
          前のアプリに戻る
        </button>
      ) : null}
    </div>
    <button
      className="ui-button ui-button-primary connection-next"
      disabled={!allConnected || busy}
      onClick={onNext}
      type="button"
    >
      {nextLabel(allConnected, resumeWorkspace)}
      <span aria-hidden="true">→</span>
    </button>
  </div>
);

const ConnectionProviderList = ({
  allConnected,
  deviceExtra,
  loading,
  nextService,
  onCancel,
  pendingService,
  renderCard,
}: {
  allConnected: boolean;
  deviceExtra: ReactNode;
  loading: boolean;
  nextService: (typeof SERVICES)[number] | null;
  onCancel: () => void;
  pendingService?: ServiceId | null;
  renderCard: (
    service: (typeof SERVICES)[number],
    featured: boolean,
    extra?: ReactNode
  ) => ReactNode;
}) => (
  <div aria-busy={loading} className="connection-provider-list">
    {SERVICES.map((service) => {
      let extra: ReactNode;
      if (service.id === "chatgpt") {
        extra = deviceExtra;
      } else if (service.id === pendingService) {
        extra = <PendingAuthorization onCancel={onCancel} />;
      }
      return renderCard(
        service,
        !allConnected && service.id === nextService?.id,
        extra
      );
    })}
  </div>
);

const ConnectBoard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToNew =
    useConnectionReturn(searchParams.get("returnTo")) === "/new";
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
  const workspaces = useWorkspaceList();
  const [errors, setErrors] = useState<Partial<Record<ServiceId, string>>>({});
  const { busy, pendingNative, dispatchActivity } = useConnectionActivity(
    board?.connections
  );
  const [device, setDevice] = useState<DeviceSession | null>(null);
  const [pendingOc, setPendingOc] = useState<PendingOc | null>(null);

  const configured = board?.configured;
  const connectedCount = (board?.connections ?? []).filter(
    (row) => row.status === "connected"
  ).length;
  const allConnected = Boolean(board?.allConnected);
  const nextService = nextDisconnected(board?.connections);
  const resumeWorkspace = !returnToNew && lastWorkspace !== null;
  useFirstCreateAdvance({
    allConnected,
    hasLastWorkspace: lastWorkspace !== null,
    workspaceCount: workspaces === undefined ? null : workspaces.length,
  });

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
        dispatchActivity({ type: "finish" });
        refresh();
      } catch (error) {
        if (!cancelled) {
          setErrors((current) => ({
            ...current,
            chatgpt: connectErrorMessage(error),
          }));
          setDevice(null);
          dispatchActivity({ type: "finish" });
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
  }, [device, pollDevice, refresh, dispatchActivity, signInWithTicket]);

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
        dispatchActivity({ type: "finish" });
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
          dispatchActivity({ type: "finish" });
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
  }, [confirmOc, pendingOc, refresh, dispatchActivity, signInWithTicket]);

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
    dispatchActivity({ service: id, type: "start" });
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
      } else {
        dispatchActivity({ service: id, type: "native" });
      }
      openOauthTab(started.url);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [id]: connectErrorMessage(error),
      }));
      dispatchActivity({ type: "finish" });
    }
  };

  const startDisconnect = async (id: ServiceId) => {
    dispatchActivity({ service: id, type: "start" });
    try {
      await disconnect({ provider: id });
      refresh();
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [id]: connectErrorMessage(error),
      }));
    } finally {
      dispatchActivity({ type: "finish" });
    }
  };

  const goNext = () => {
    if (!allConnected) {
      return;
    }
    clearConnectionReturn();
    if (!resumeWorkspace) {
      markFirstActivationConsumed();
    }
    router.push(
      destinationAfterConnect({
        lastPath: lastWorkspace?.path ?? null,
        resumeWorkspace,
        workspaceCount: workspaces?.length ?? 0,
      })
    );
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
        dispatchActivity({ type: "finish" });
      }}
      onOpen={() => {
        openOauthTab(device.verificationUrl);
      }}
      userCode={device.userCode}
    />
  ) : null;

  return (
    <>
      <ConnectHeading />
      {banner ? (
        <p className="connection-banner" role="alert">
          {banner}
        </p>
      ) : null}
      <ConnectProgress count={connectedCount} loading={board === undefined} />
      <ConnectionProviderList
        allConnected={allConnected}
        deviceExtra={chatgptExtra}
        loading={board === undefined}
        nextService={nextService}
        onCancel={() => {
          clearPendingOc();
          setPendingOc(null);
          dispatchActivity({ type: "finish" });
        }}
        pendingService={pendingOc?.service ?? pendingNative}
        renderCard={cardFor}
      />
      <ConnectionFooter
        allConnected={allConnected}
        busy={busy !== null}
        nextHint={hintForBoard(
          allConnected,
          resumeWorkspace ? lastWorkspace : null
        )}
        onNext={goNext}
        onResume={
          returnToNew && lastWorkspace
            ? () => {
                if (!allConnected) {
                  return;
                }
                clearConnectionReturn();
                router.push(lastWorkspace.path);
              }
            : undefined
        }
        resumeWorkspace={resumeWorkspace}
      />
      <p className="connection-ownership">
        作ったアプリも、データも。あなたのアカウントに残ります。
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
      <ConnectHeading />
      <div className="connection-banner">
        <span aria-hidden="true" className="connection-banner-icon">
          i
        </span>
        <div>
          <strong>接続サービスが設定されていません</strong>
          <p>設定が完了すると、ここからアカウントをつなげます。</p>
        </div>
      </div>
      <ConnectProgress count={0} />
      <div className="connection-provider-list">
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
      <div className="connection-footer">
        <div>
          <p className="connection-footer-title">
            画面の使い方を、先に見てみる。
          </p>
          <p>画面プレビューでは、アプリの作成や公開は行いません。</p>
        </div>
        <button
          className="ui-button connection-next"
          onClick={() => {
            router.push("/new");
          }}
          type="button"
        >
          画面プレビューを開く <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="connection-ownership">
        作ったアプリも、データも。あなたのアカウントに残ります。
      </p>
    </>
  );
};

export const ConnectScreen = () => (
  <ShellGate>
    <AppFrame>
      <main className="connection-main">
        <div className="connection-layout">
          {hasConvexUrl() ? (
            <Suspense
              fallback={
                <>
                  <ConnectHeading />
                  <ConnectProgress count={0} loading />
                </>
              }
            >
              <ConnectBoard />
            </Suspense>
          ) : (
            <ConnectOffline />
          )}
        </div>
      </main>
    </AppFrame>
  </ShellGate>
);
