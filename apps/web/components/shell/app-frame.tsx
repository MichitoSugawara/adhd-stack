"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import SidebarNav from "@/components/primitives/SidebarNav";
import { useShell } from "@/lib/shell-state";

const navFromPath = (pathname: string): string => {
  if (pathname.startsWith("/connect")) {
    return "connect";
  }
  if (pathname.startsWith("/p/") || pathname.startsWith("/projects")) {
    return "projects";
  }
  return "projects";
};

export const AppFrame = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const router = useRouter();
  const shell = useShell();
  const [narrow, setNarrow] = useState(false);

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
    <div className="bg-page text-ink flex min-h-dvh">
      <SidebarNav
        activeNav={navFromPath(pathname)}
        fill
        onFooterClick={() => {
          router.push("/connect");
        }}
        onNavigate={(key) => {
          if (key === "connect") {
            router.push("/connect");
            return;
          }
          router.push("/projects");
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
            app.status === "creating" ? `/p/${app.id}/creating` : `/p/${app.id}`
          );
        }}
        onSignOut={() => {
          shell.leaveShell();
          router.push("/");
        }}
        defaultCollapsed={narrow}
        recents={shell.state.apps.map((app) => ({
          id: app.id,
          label: app.name,
        }))}
      />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
};
