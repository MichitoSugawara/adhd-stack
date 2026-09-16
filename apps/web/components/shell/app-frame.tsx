"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import SidebarNav from "@/components/primitives/SidebarNav";
import type { SidebarSetupItem } from "@/components/primitives/SidebarNav";
import { WithSignOut } from "@/components/shell/with-sign-out";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { rememberPath, useLastWorkspace } from "@/lib/last-workspace";
import { SERVICES } from "@/lib/services";
import { useShell } from "@/lib/shell-state";

const idleSetup = (): SidebarSetupItem[] =>
  SERVICES.map((service) => ({
    id: service.id,
    label: service.label,
    status: "idle",
  }));

const navFromPath = (pathname: string): string => {
  if (pathname.startsWith("/connect")) {
    return "connect";
  }
  if (pathname.startsWith("/projects")) {
    return "list";
  }
  if (pathname.includes("/envs") || pathname.includes("/publish")) {
    return "env";
  }
  if (pathname.startsWith("/p/")) {
    return "editor";
  }
  return "list";
};

const editorPath = (slug?: string): string =>
  slug ? `/p/${slug}` : "/projects";

const envPath = (slug?: string): string =>
  slug ? `/p/${slug}/envs` : "/projects";

const FrameSidebar = ({
  connectCount,
  setupItems,
}: {
  connectCount?: string;
  setupItems: SidebarSetupItem[];
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const shell = useShell();
  const lastWorkspace = useLastWorkspace();
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    rememberPath(pathname);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => {
      setNarrow(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  return (
    <WithSignOut>
      {(signOut) => (
        <SidebarNav
          activeNav={navFromPath(pathname)}
          connectCount={connectCount}
          defaultCollapsed={narrow}
          fill
          onFooterClick={() => {
            router.push("/connect");
          }}
          onNavigate={(key) => {
            if (key === "start") {
              router.push("/projects?new=1");
              return;
            }
            if (key === "connect") {
              router.push("/connect");
              return;
            }
            if (key === "list") {
              router.push("/projects");
              return;
            }
            if (key === "env") {
              router.push(envPath(lastWorkspace?.slug));
              return;
            }
            router.push(editorPath(lastWorkspace?.slug));
          }}
          onNewChat={() => {
            router.push("/projects?new=1");
          }}
          onPick={(id) => {
            const app = shell.state.apps.find((item) => item.id === id);
            if (!app) {
              return;
            }
            router.push(
              app.status === "creating"
                ? `/p/${app.id}/creating`
                : `/p/${app.id}`
            );
          }}
          onSignOut={() => {
            void (async () => {
              await signOut();
              router.push("/");
            })();
          }}
          recents={shell.state.apps.map((app) => ({
            id: app.id,
            label: app.name,
          }))}
          setupItems={setupItems}
        />
      )}
    </WithSignOut>
  );
};

const LiveSidebar = () => {
  const { board } = useConnectionsPort();
  const setupItems = SERVICES.map((service) => {
    const row = board?.connections.find((item) => item.provider === service.id);
    return {
      id: service.id,
      label: service.label,
      status: row?.status === "connected" ? "connected" : "idle",
    } satisfies SidebarSetupItem;
  });
  const connected = setupItems.filter(
    (item) => item.status === "connected"
  ).length;
  return (
    <FrameSidebar
      connectCount={`${String(connected)}/4`}
      setupItems={setupItems}
    />
  );
};

export const AppFrame = ({ children }: { children: ReactNode }) => (
  <div className="bg-page text-ink flex min-h-dvh">
    {hasConvexUrl() ? (
      <LiveSidebar />
    ) : (
      <FrameSidebar connectCount="0/4" setupItems={idleSetup()} />
    )}
    <div className="flex min-w-0 flex-1 flex-col">{children}</div>
  </div>
);
