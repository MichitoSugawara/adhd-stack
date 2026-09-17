"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import SidebarNav from "@/components/primitives/SidebarNav";
import type {
  SidebarRecent,
  SidebarSetupItem,
} from "@/components/primitives/SidebarNav";
import { CommandMenu } from "@/components/shell/command-menu";
import { WithSignOut } from "@/components/shell/with-sign-out";
import { WorkspaceIcon } from "@/components/shell/workspace-icon";
import { useWorkspaceList } from "@/lib/coding-port";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { rememberPath, useLastWorkspace } from "@/lib/last-workspace";
import { SERVICES } from "@/lib/services";
import { useShell } from "@/lib/shell-state";

const navFromPath = (path: string) => {
  if (path.startsWith("/new")) {
    return "start";
  }
  if (path.startsWith("/connect")) {
    return "connect";
  }
  if (path.includes("/envs") || path.includes("/publish")) {
    return "env";
  }
  if (path.startsWith("/p/")) {
    return "editor";
  }
  return "list";
};
const titles = {
  connect: "接続",
  editor: "ワークスペース",
  env: "公開と環境",
  list: "アプリ一覧",
  start: "新しいアプリ",
};
const EMPTY_IDS: string[] = [];

const Frame = ({
  children,
  recents,
  setupItems,
  creatingIds = EMPTY_IDS,
}: {
  children: ReactNode;
  recents: SidebarRecent[];
  setupItems: SidebarSetupItem[];
  creatingIds?: string[];
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const lastWorkspace = useLastWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const mobileDialog = useRef<HTMLDialogElement>(null);
  const connected = setupItems.filter(
    (item) => item.status === "connected"
  ).length;
  const activeNav = navFromPath(pathname);
  const activeSlug = pathname.startsWith("/p/")
    ? pathname.split("/")[2]
    : undefined;

  useEffect(() => {
    rememberPath(pathname);
  }, [pathname]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === "k" &&
        !event.isComposing
      ) {
        event.preventDefault();
        mobileDialog.current?.close();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  }, []);

  const navigate = (href: string) => {
    mobileDialog.current?.close();
    router.push(href);
  };
  const go = (key: string) => {
    const routes = new Map<string, string>(
      Object.entries({
        connect: "/connect",
        editor: lastWorkspace ? `/p/${lastWorkspace.slug}` : "/projects",
        env: lastWorkspace ? `/p/${lastWorkspace.slug}/envs` : "/projects",
        list: "/projects",
        start: "/new",
      })
    );
    navigate(routes.get(key) ?? "/projects");
  };
  const logout = async (signOut: () => Promise<void>) => {
    try {
      await signOut();
      navigate("/");
    } catch {
      setSignOutError(true);
    }
  };
  const pick = (id: string) =>
    navigate(creatingIds.includes(id) ? `/p/${id}/creating` : `/p/${id}`);
  const sidebarProps = {
    activeNav,
    activeSlug,
    connectCount: `${connected}/4`,
    onNavigate: go,
    onPick: pick,
    onSearch: () => {
      mobileDialog.current?.close();
      setCommandOpen(true);
    },
    recents,
    setupItems,
  };

  return (
    <WithSignOut>
      {(signOut) => (
        <div className="workspace-frame">
          <a className="skip-link" href="#workspace-content">
            メインコンテンツへ
          </a>
          <div className="desktop-sidebar">
            <SidebarNav
              {...sidebarProps}
              collapsed={collapsed}
              onCollapse={() => setCollapsed((value) => !value)}
              onSignOut={() => {
                void logout(signOut);
              }}
            />
          </div>
          <dialog
            className="mobile-navigation"
            ref={mobileDialog}
            aria-label="ナビゲーション"
          >
            <button
              className="ui-icon-button mobile-nav-close"
              onClick={() => mobileDialog.current?.close()}
              type="button"
              aria-label="メニューを閉じる"
            >
              <WorkspaceIcon name="close" />
            </button>
            <SidebarNav
              {...sidebarProps}
              onCollapse={() => mobileDialog.current?.close()}
              onSignOut={() => {
                void logout(signOut);
              }}
            />
          </dialog>
          <div className="workspace-main" id="workspace-content" tabIndex={-1}>
            <header className="workspace-topbar">
              <button
                className="ui-icon-button mobile-menu-toggle"
                onClick={() => mobileDialog.current?.showModal()}
                type="button"
                aria-label="メニューを開く"
              >
                <WorkspaceIcon name="menu" />
              </button>
              <div className="workspace-breadcrumb">
                <Link href="/projects">マイワークスペース</Link>
                <span>/</span>
                <span>{titles[activeNav]}</span>
              </div>
              <div className="workspace-topbar-actions">
                {hasConvexUrl() ? (
                  <span className="workspace-personal">PERSONAL</span>
                ) : (
                  <span className="workspace-preview-label">UI プレビュー</span>
                )}
                <button
                  className="ui-icon-button"
                  onClick={() => setCommandOpen(true)}
                  aria-label="検索と移動を開く"
                  title="検索と移動（⌘K）"
                  type="button"
                >
                  <WorkspaceIcon name="command" size={16} />
                </button>
              </div>
            </header>
            {signOutError ? (
              <p role="alert" className="info-note">
                ログアウトできませんでした。もう一度お試しください。
              </p>
            ) : null}
            <div className="workspace-content">{children}</div>
          </div>
          <CommandMenu
            open={commandOpen}
            onClose={() => setCommandOpen(false)}
            recents={recents}
            onNavigate={navigate}
            creatingIds={creatingIds}
          />
        </div>
      )}
    </WithSignOut>
  );
};

const LiveWorkspaces = ({
  children,
  setupItems,
}: {
  children: ReactNode;
  setupItems: SidebarSetupItem[];
}) => {
  const apps = useWorkspaceList();
  return (
    <Frame
      recents={(apps ?? []).map((app) => ({ id: app.slug, label: app.name }))}
      creatingIds={(apps ?? []).flatMap((app) =>
        app.provisionStatus === "ready" ? [] : [app.slug]
      )}
      setupItems={setupItems}
    >
      {children}
    </Frame>
  );
};
const LiveFrame = ({ children }: { children: ReactNode }) => {
  const { board } = useConnectionsPort();
  const setupItems = SERVICES.map(
    (service) =>
      ({
        id: service.id,
        label: service.label,
        status:
          board?.connections.find((item) => item.provider === service.id)
            ?.status === "connected"
            ? "connected"
            : "idle",
      }) satisfies SidebarSetupItem
  );
  return board?.authenticated ? (
    <LiveWorkspaces setupItems={setupItems}>{children}</LiveWorkspaces>
  ) : (
    <Frame recents={[]} setupItems={setupItems}>
      {children}
    </Frame>
  );
};
const OfflineFrame = ({ children }: { children: ReactNode }) => {
  const shell = useShell();
  return (
    <Frame
      recents={shell.state.apps.map((app) => ({ id: app.id, label: app.name }))}
      creatingIds={shell.state.apps.flatMap((app) =>
        app.status === "creating" ? [app.id] : []
      )}
      setupItems={SERVICES.map((service) => ({
        id: service.id,
        label: service.label,
        status: "idle",
      }))}
    >
      {children}
    </Frame>
  );
};
export const AppFrame = ({ children }: { children: ReactNode }) =>
  hasConvexUrl() ? (
    <LiveFrame>{children}</LiveFrame>
  ) : (
    <OfflineFrame>{children}</OfflineFrame>
  );
