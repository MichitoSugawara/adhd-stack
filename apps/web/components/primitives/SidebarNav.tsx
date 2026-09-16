"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconArrowBoxLeft } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconArrowBoxLeft";
import { IconCheckmark1Small } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconCheckmark1Small";
import { IconChevronDownSmall } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconChevronDownSmall";
import { IconConnectors1 } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconConnectors1";
import { IconCrossSmall } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconCrossSmall";
import { IconEditBig } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconEditBig";
import { IconLayersTwo } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconLayersTwo";
import { IconListBullets } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconListBullets";
import { IconMagnifyingGlass } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconMagnifyingGlass";
import { IconPlusMedium } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconPlusMedium";
import { IconPopsicle2 } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconPopsicle2";
import { IconSettingsGear1 } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconSettingsGear1";
import { IconSidebarLeftArrow } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconSidebarLeftArrow";
import GlideMenu from "@/components/primitives/GlideMenu";

/* ─────────────────────────────────────────────────────────
 * SIDEBAR NAV
 * Shared by the design-system preview and the harness shell:
 * compact workspace switcher, primary navigation, searchable
 * chat history, and a collapse that preserves icon alignment.
 * ───────────────────────────────────────────────────────── */

const WORKSPACE = { key: "adhd", name: "ADHD Stack", monogram: "A" };

const NAV_ITEMS = [
  { key: "start", label: "最初から", icon: <IconPlusMedium size={16} /> },
  { key: "connect", label: "接続", icon: <IconConnectors1 size={16} /> },
  { key: "list", label: "一覧", icon: <IconListBullets size={16} /> },
  { key: "editor", label: "エディタ", icon: <IconEditBig size={16} /> },
  { key: "env", label: "環境", icon: <IconLayersTwo size={16} /> },
];

export type SidebarSetupItem = {
  id: string;
  label: string;
  status: "connected" | "idle" | "waiting";
};

export type SidebarRecent = {
  id: string;
  label: string;
  prompt?: string;
};

const DEFAULT_RECENTS: SidebarRecent[] = [];

type SidebarNavProps = {
  activeTitle?: string | null;
  className?: string;
  fill?: boolean;
  onNewChat?: () => void;
  onPick?: (id: string, label: string, prompt?: string) => void;
  /** controlled primary-nav selection (e.g. "home" | "invite") */
  activeNav?: string;
  onNavigate?: (key: string) => void;
  /** footer call-to-action — defaults to returning to connections */
  footerLabel?: string;
  footerIcon?: ReactNode;
  onFooterClick?: () => void;
  recents?: SidebarRecent[];
  recentsLabel?: string;
  newChatLabel?: string;
  setupItems?: SidebarSetupItem[];
  connectCount?: string;
  searchPlaceholder?: string;
  emptyRecentsLabel?: string;
  signOutLabel?: string;
  onSignOut?: () => void;
  variant?: string;
  defaultCollapsed?: boolean;
};

const SIDEBAR_MOTION = {
  expandedWidth: 224,
  collapsedWidth: 52,
  duration: 280,
  copyDuration: 180,
  copyOffset: 8,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

/* ─────────────────────────────────────────────────────────
 * CHAT SEARCH STORYBOARD
 *
 *   0ms   search is triggered; Chats label begins fading
 *   0ms   field grows right → left from the search control
 * 180ms   field fills the row; cursor is focused and ready
 * ───────────────────────────────────────────────────────── */
const CHAT_SEARCH_MOTION = {
  duration: 180,
  closedWidth: 28,
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
};

function GlideGroup({ children }: { children: ReactNode }) {
  return (
    <GlideMenu
      rowSelector="[data-row]"
      highlightClassName="sidebar-glide-highlight rounded-[7px] bg-hover-2"
      className="group/glide flex flex-col gap-px"
    >
      {children}
    </GlideMenu>
  );
}

function RailButton({
  icon,
  label,
  active = false,
  count,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  count?: string;
  onClick?: () => void;
}) {
  return (
    <button
      data-row
      type="button"
      onClick={onClick}
      className={`sidebar-row relative z-10 mx-2 flex h-7 items-center rounded-[8px] px-2 text-left
        transition-[width,background-color,color,transform] duration-150 active:scale-[0.98]
        ${active ? "bg-accent-tint group-hover/glide:bg-transparent" : ""}`}
    >
      <span className={`flex size-5 shrink-0 items-center justify-center ${active ? "text-accent-ink" : "text-ink-2"}`}>
        {icon}
      </span>
      <span className={`sidebar-copy ml-1.5 min-w-0 flex-1 truncate text-[13px] font-medium ${active ? "text-accent-ink" : "text-ink-2"}`}>
        {label}
      </span>
      {count && (
        <span className="sidebar-copy mr-2 shrink-0 text-[12px] font-medium tabular-nums text-ink-3">
          {count}
        </span>
      )}
    </button>
  );
}

function WorkspaceMenu({
  onManage,
  onSignOut,
  position,
  signOutLabel,
}: {
  onManage: () => void;
  onSignOut?: () => void;
  position: { top: number; left: number };
  signOutLabel: string;
}) {
  return createPortal(
    <div
      data-workspace-menu
      className="fixed z-50 w-64 rounded-[14px] bg-surface p-1.5 shadow-overlay"
      style={{
        top: position.top,
        left: position.left,
        animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: "top left",
      }}
    >
      <GlideMenu className="flex flex-col gap-px" highlightClassName="inset-x-0 rounded-[8px] bg-hover-2">
        <button
          data-menu-row
          type="button"
          onClick={onManage}
          className="relative z-10 flex h-10 w-full items-center gap-1.5 rounded-[8px] px-2 text-left"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-ink text-[11px] font-semibold text-surface">
            {WORKSPACE.monogram}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">{WORKSPACE.name}</span>
          <span className="shrink-0 text-ink"><IconCheckmark1Small size={18} /></span>
        </button>
        <div className="my-1 h-px bg-line" />
        <button
          data-menu-row
          type="button"
          onClick={onManage}
          className="relative z-10 flex h-9 w-full items-center gap-1.5 rounded-[8px] px-2 text-left"
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-ink-2"><IconSettingsGear1 size={16} /></span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">接続を管理</span>
        </button>
        <div className="my-1 h-px bg-line" />
        <button
          data-menu-row
          type="button"
          onClick={onSignOut}
          className="relative z-10 flex h-9 w-full items-center gap-1.5 rounded-[8px] px-2 text-left"
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-ink-2"><IconArrowBoxLeft size={16} /></span>
          <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{signOutLabel}</span>
        </button>
      </GlideMenu>
    </div>,
    document.body,
  );
}

export default function SidebarNav({
  activeTitle,
  className = "",
  fill = false,
  onNewChat,
  onPick,
  activeNav,
  onNavigate,
  footerLabel = "接続へ",
  footerIcon,
  onFooterClick,
  recents = DEFAULT_RECENTS,
  recentsLabel = "アプリ",
  setupItems = [],
  connectCount,
  searchPlaceholder = "アプリを探す",
  emptyRecentsLabel = "まだアプリがありません",
  signOutLabel = "シェルを閉じる",
  onSignOut,
  defaultCollapsed = false,
}: SidebarNavProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [internalNav, setInternalNav] = useState("chats");
  const currentNav = activeNav ?? internalNav;
  const selectNav = (key: string) => {
    setInternalNav(key);
    onNavigate?.(key);
  };
  const [demoActiveTitle, setDemoActiveTitle] = useState<string | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspacePosition, setWorkspacePosition] = useState({ top: 0, left: 0 });
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const workspaceButtonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedTitle = activeTitle === undefined ? demoActiveTitle : activeTitle;
  const visibleRecents = recents.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!workspaceOpen) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-workspace-trigger]") && !target.closest("[data-workspace-menu]")) {
        setWorkspaceOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [workspaceOpen]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    setCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);

  const collapse = () => {
    setCollapsed(true);
    setWorkspaceOpen(false);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <aside
      data-sidebar-collapsed={collapsed}
      aria-label="Workspace navigation"
      className={`relative flex shrink-0 overflow-hidden border-line border-r bg-surface transition-[width] ${fill ? "h-full" : "h-[600px]"} ${className}`}
      style={{
        width: collapsed ? SIDEBAR_MOTION.collapsedWidth : SIDEBAR_MOTION.expandedWidth,
        transitionDuration: `${SIDEBAR_MOTION.duration}ms`,
        transitionTimingFunction: SIDEBAR_MOTION.easing,
        "--sidebar-copy-duration": `${SIDEBAR_MOTION.copyDuration}ms`,
        "--sidebar-copy-offset": `${SIDEBAR_MOTION.copyOffset}px`,
        "--sidebar-easing": SIDEBAR_MOTION.easing,
      } as CSSProperties}
    >
      <div className="flex min-h-0 w-[224px] shrink-0 flex-col">
        <div className="relative mb-2.5 h-10 shrink-0">
          <button
            ref={workspaceButtonRef}
            data-workspace-trigger
            type="button"
            aria-expanded={workspaceOpen}
            aria-hidden={collapsed}
            tabIndex={collapsed ? -1 : 0}
            onClick={() => {
              if (!workspaceOpen && workspaceButtonRef.current) {
                const rect = workspaceButtonRef.current.getBoundingClientRect();
                setWorkspacePosition({ top: rect.bottom + 6, left: rect.left });
              }
              setWorkspaceOpen((open) => !open);
            }}
            className="sidebar-workspace-control absolute left-2 top-1 flex h-8 w-[164px] items-center rounded-[8px] px-2 text-left transition-[background-color,transform] duration-100 hover:bg-hover-2 active:scale-[0.99]"
          >
            <span className="sidebar-logo flex size-5 shrink-0 items-center justify-center text-ink">
              <IconPopsicle2 size={18} />
            </span>
            <span className="sidebar-copy ml-1.5 min-w-0 flex-1 truncate text-[14px] font-medium text-ink-2">
              {WORKSPACE.name}
            </span>
            <span className="sidebar-copy ml-1 flex shrink-0 text-ink-3">
              <IconChevronDownSmall size={16} />
            </span>
          </button>

          {workspaceOpen && (
            <WorkspaceMenu
              onManage={() => {
                setWorkspaceOpen(false);
                selectNav("connect");
              }}
              onSignOut={() => {
                setWorkspaceOpen(false);
                onSignOut?.();
              }}
              position={workspacePosition}
              signOutLabel={signOutLabel}
            />
          )}

          <button
            type="button"
            aria-label="Collapse sidebar"
            aria-hidden={collapsed}
            tabIndex={collapsed ? -1 : 0}
            onClick={collapse}
            className="sidebar-collapse-control absolute right-2 top-1 flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink"
          >
            <IconSidebarLeftArrow size={18} />
          </button>
          <button
            type="button"
            aria-label="Expand sidebar"
            aria-hidden={!collapsed}
            tabIndex={collapsed ? 0 : -1}
            onClick={() => setCollapsed(false)}
            className="sidebar-expand-control absolute left-2 top-0.5 flex size-9 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color] duration-150 hover:bg-hover-2 hover:text-ink"
          >
            <IconSidebarLeftArrow size={18} className="rotate-180" />
          </button>
        </div>

        <GlideGroup>
          {NAV_ITEMS.map((item) => (
            <RailButton
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={currentNav === item.key}
              count={item.key === "connect" ? connectCount : undefined}
              onClick={() => {
                if (item.key === "start" && activeTitle === undefined) {
                  setDemoActiveTitle(null);
                }
                if (item.key === "start" && !onNavigate) {
                  onNewChat?.();
                }
                selectNav(item.key);
              }}
            />
          ))}
        </GlideGroup>

        {setupItems.length > 0 ? (
          <div className="mt-3">
            <div className="sidebar-copy mx-2 mb-1 px-2 text-[11px] font-medium tracking-[0.08em] text-ink-3 uppercase">
              サービス
            </div>
            <div className="flex flex-col gap-px">
              {setupItems.map((item) => (
                <div
                  className="sidebar-row relative z-10 mx-2 flex h-7 items-center rounded-[8px] px-2"
                  key={item.id}
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${
                      item.status === "connected" ? "bg-accent" : "bg-ink-3"
                    }`}
                  />
                  <span className="sidebar-copy text-ink-2 ml-1.5 min-w-0 flex-1 truncate text-[13px]">
                    {item.label}
                  </span>
                  <span className="sidebar-copy text-ink-3 shrink-0 text-[11px]">
                    {item.status === "connected" ? "済" : "未"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <div className="sidebar-copy relative mx-2 mb-1 h-8">
            <div
              aria-hidden={searchOpen}
              className={`absolute inset-0 flex items-center gap-1.5 px-2 text-[12.5px] font-medium text-ink-3 transition-[opacity,transform] ${searchOpen ? "pointer-events-none -translate-x-1 opacity-0" : "translate-x-0 opacity-100"}`}
              style={{ transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`, transitionTimingFunction: CHAT_SEARCH_MOTION.easing }}
            >
              <IconChevronDownSmall size={16} />
              <span>{recentsLabel}</span>
            </div>

            <button
              type="button"
              aria-label="Search chats"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen(true)}
              className={`absolute right-0 top-0 z-10 flex size-8 items-center justify-center rounded-[8px] text-ink-3 transition-[opacity,background-color,color,transform] hover:bg-hover-2 hover:text-ink active:scale-[0.96] ${searchOpen ? "pointer-events-none opacity-0" : "opacity-100"}`}
              style={{ transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms` }}
            >
              <IconMagnifyingGlass size={16} />
            </button>

            <div
              className={`absolute right-0 top-0 z-20 flex h-8 items-center overflow-hidden rounded-[8px] bg-field text-ink-3 shadow-hairline transition-[width,opacity] focus-within:text-ink-2 ${searchOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
              style={{
                width: searchOpen ? "100%" : CHAT_SEARCH_MOTION.closedWidth,
                transitionDuration: `${CHAT_SEARCH_MOTION.duration}ms`,
                transitionTimingFunction: CHAT_SEARCH_MOTION.easing,
              }}
            >
              <span className="ml-2 flex shrink-0 items-center justify-center">
                <IconMagnifyingGlass size={15} />
              </span>
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setSearchOpen(false);
                    setQuery("");
                  }
                }}
                placeholder={searchPlaceholder}
                aria-label="アプリを探す"
                className="ml-1.5 min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-ink-3"
              />
              <button
                type="button"
                aria-label="Close chat search"
                onClick={() => {
                  setSearchOpen(false);
                  setQuery("");
                }}
                className="flex size-8 shrink-0 items-center justify-center rounded-[8px] text-ink-3 transition-[background-color,color,transform] duration-150 hover:bg-hover-2 hover:text-ink active:scale-[0.96]"
              >
                <IconCrossSmall size={16} />
              </button>
            </div>
          </div>

          <GlideGroup>
            {visibleRecents.map((item) => {
              const active = item.label === selectedTitle;
              return (
                <button
                  key={item.id}
                  data-row
                  type="button"
                  title={item.label}
                  onClick={() => {
                    selectNav("editor");
                    if (activeTitle === undefined) setDemoActiveTitle(item.label);
                    onPick?.(item.id, item.label, item.prompt);
                  }}
                  className={`sidebar-row relative z-10 mx-2 flex h-7 items-center rounded-[8px] px-2 text-left transition-[width,background-color,color,transform] duration-150 active:scale-[0.98] ${
                    active ? "bg-accent-tint group-hover/glide:bg-transparent" : ""
                  }`}
                >
                  <span className={`sidebar-copy min-w-0 flex-1 truncate text-[13px] font-medium ${active ? "text-accent-ink" : "text-ink-2"}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            {visibleRecents.length === 0 && (
              <div className="sidebar-copy mx-2 px-2 py-2 text-[12.5px] text-ink-3">{emptyRecentsLabel}</div>
            )}
          </GlideGroup>
        </div>

        <div className="sidebar-copy mx-2 mt-3 w-[208px] border-t border-line pt-3">
          <button
            type="button"
            onClick={onFooterClick ?? onNewChat}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-control bg-hover-2 text-[12.5px] font-medium text-ink transition-[background-color,transform] duration-150 hover:bg-line-strong active:scale-[0.98]"
          >
            {footerIcon}
            {footerLabel}
          </button>
        </div>
      </div>
    </aside>
  );
}
