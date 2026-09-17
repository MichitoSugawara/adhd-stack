"use client";

import { StackLogo, WorkspaceIcon } from "@/components/shell/workspace-icon";

// Grouped navigation follows Circle's app-sidebar and nav-workspace.
// https://github.com/ln-dev7/circle/tree/master/components/layout/sidebar
export type SidebarSetupItem = {
  id: string;
  label: string;
  status: "connected" | "idle" | "waiting";
};
export type SidebarRecent = { id: string; label: string; prompt?: string };

interface SidebarNavProps {
  activeNav?: string;
  activeSlug?: string;
  onNavigate?: (key: string) => void;
  connectCount?: string;
  onSignOut?: () => void;
  onPick?: (id: string) => void;
  onSearch?: () => void;
  recents?: SidebarRecent[];
  setupItems?: SidebarSetupItem[];
  collapsed?: boolean;
  onCollapse?: () => void;
  canOpenEnv?: boolean;
}

export default function SidebarNav({
  activeNav,
  activeSlug,
  onNavigate,
  connectCount,
  onSignOut,
  onPick,
  onSearch,
  recents = [],
  setupItems = [],
  collapsed,
  onCollapse,
  canOpenEnv = false,
}: SidebarNavProps) {
  const connected = setupItems.filter(
    (item) => item.status === "connected"
  ).length;
  return (
    <aside
      aria-label="ワークスペースナビゲーション"
      className={`workspace-sidebar ${collapsed ? "is-collapsed" : ""}`}
    >
      <div className="sidebar-brand">
        <button
          className="sidebar-wordmark"
          onClick={() => onNavigate?.("list")}
          type="button"
          aria-label="ADHD Stack アプリ一覧"
        >
          <StackLogo />
          <span>
            ADHD <b>Stack</b>
            <small>YOUR PERSONAL STUDIO</small>
          </span>
        </button>
        <button
          className="ui-icon-button sidebar-collapse"
          aria-label={
            collapsed ? "サイドバーを広げる" : "サイドバーを折りたたむ"
          }
          onClick={onCollapse}
          type="button"
        >
          <WorkspaceIcon name="panel" size={16} />
        </button>
      </div>
      <button
        className="sidebar-search"
        onClick={onSearch}
        type="button"
        title="検索と移動"
      >
        <WorkspaceIcon name="search" size={16} />
        <span>検索と移動</span>
        <kbd>⌘ K</kbd>
      </button>
      <button
        className="sidebar-create"
        onClick={() => onNavigate?.("start")}
        type="button"
        title="新しいアプリ"
      >
        <WorkspaceIcon name="plus" size={17} />
        <span>新しいアプリ</span>
      </button>
      <nav className="sidebar-navigation" aria-label="メインメニュー">
        <button
          className={`sidebar-nav-item ${activeNav === "list" ? "is-active" : ""}`}
          aria-current={activeNav === "list" ? "page" : undefined}
          onClick={() => onNavigate?.("list")}
          type="button"
          title="アプリ一覧"
        >
          <WorkspaceIcon name="apps" size={17} />
          <span>アプリ一覧</span>
          <small>{recents.length || ""}</small>
        </button>
        <button
          className={`sidebar-nav-item ${activeNav === "connect" ? "is-active" : ""}`}
          aria-current={activeNav === "connect" ? "page" : undefined}
          onClick={() => onNavigate?.("connect")}
          type="button"
          title="接続"
        >
          <WorkspaceIcon name="connect" size={17} />
          <span>接続</span>
          <small>{connectCount}</small>
        </button>
        {canOpenEnv ? (
          <button
            className={`sidebar-nav-item ${activeNav === "env" ? "is-active" : ""}`}
            aria-current={activeNav === "env" ? "page" : undefined}
            onClick={() => onNavigate?.("env")}
            type="button"
            title="環境"
          >
            <WorkspaceIcon name="globe" size={17} />
            <span>環境</span>
          </button>
        ) : null}
      </nav>
      <div className="sidebar-recents">
        <p className="sidebar-section-label">最近のアプリ</p>
        {recents.length ? (
          recents.slice(0, 8).map((item) => (
            <button
              key={item.id}
              className={`sidebar-nav-item sidebar-recent ${activeSlug === item.id ? "is-active" : ""}`}
              aria-current={activeSlug === item.id ? "page" : undefined}
              onClick={() => onPick?.(item.id)}
              title={item.label}
              aria-label={item.label}
              type="button"
            >
              <span className="sidebar-app-mark">{item.label.slice(0, 1)}</span>
              <span>{item.label}</span>
            </button>
          ))
        ) : (
          <p className="sidebar-empty">
            ここに、あなたのアイデアが
            <br />
            並んでいきます。
          </p>
        )}
      </div>
      <div className="sidebar-bottom">
        {connected < 4 ? (
          <button
            className="sidebar-setup"
            onClick={() => onNavigate?.("connect")}
            type="button"
            title="接続を設定"
          >
            <span className="sidebar-setup-title">
              <WorkspaceIcon name="spark" size={15} />
              つくる準備<span>{connected}/4</span>
            </span>
            <span className="sidebar-setup-track">
              {setupItems.map((item) => (
                <i
                  key={item.id}
                  className={item.status === "connected" ? "is-done" : ""}
                />
              ))}
            </span>
            <span className="sidebar-setup-caption">
              サービスをつないで、始めよう
              <WorkspaceIcon name="arrow" size={14} />
            </span>
          </button>
        ) : (
          <div className="sidebar-connected">
            <span className="status-dot" />
            すべて接続済み
          </div>
        )}
        <div className="sidebar-account">
          <span className="sidebar-avatar">Y</span>
          <span>
            マイワークスペース<small>Personal workspace</small>
          </span>
          <button
            className="ui-icon-button"
            aria-label="ログアウト"
            onClick={onSignOut}
            title="ログアウト"
            type="button"
          >
            <WorkspaceIcon name="logout" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
