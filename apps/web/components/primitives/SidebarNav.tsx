"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { IconArrowBoxLeft } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconArrowBoxLeft";
import { IconCheckmark1Small } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconCheckmark1Small";
import { IconConnectors1 } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconConnectors1";
import { IconEditBig } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconEditBig";
import { IconLayersTwo } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconLayersTwo";
import { IconListBullets } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconListBullets";
import { IconPlusMedium } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconPlusMedium";
import { IconSettingsGear1 } from "@central-icons-react/round-outlined-radius-2-stroke-2/IconSettingsGear1";

/* ─────────────────────────────────────────────────────────
 * ICON RAIL
 * Minimal 60px navigation rail. Every screen lives on one
 * centered column; this rail only switches where you are.
 * The monogram opens the workspace menu (manage / sign out).
 * ───────────────────────────────────────────────────────── */

const WORKSPACE = { key: "adhd", name: "ADHD Stack", monogram: "A" };

const NAV_ITEMS = [
  { key: "start", label: "最初から", icon: <IconPlusMedium size={18} /> },
  { key: "connect", label: "接続", icon: <IconConnectors1 size={18} /> },
  { key: "list", label: "一覧", icon: <IconListBullets size={18} /> },
  { key: "editor", label: "エディタ", icon: <IconEditBig size={18} /> },
  { key: "env", label: "環境", icon: <IconLayersTwo size={18} /> },
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

type SidebarNavProps = {
  activeNav?: string;
  onNavigate?: (key: string) => void;
  connectCount?: string;
  signOutLabel?: string;
  onSignOut?: () => void;
  fill?: boolean;
  className?: string;
  /* Accepted for compatibility; the rail no longer renders these. */
  activeTitle?: string | null;
  onNewChat?: () => void;
  onPick?: (id: string, label: string, prompt?: string) => void;
  footerLabel?: string;
  footerIcon?: ReactNode;
  onFooterClick?: () => void;
  recents?: SidebarRecent[];
  recentsLabel?: string;
  newChatLabel?: string;
  setupItems?: SidebarSetupItem[];
  searchPlaceholder?: string;
  emptyRecentsLabel?: string;
  variant?: string;
  defaultCollapsed?: boolean;
};

function RailItem({
  active,
  count,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  count?: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`relative flex w-full flex-col items-center gap-1 rounded-[10px] py-2 transition-colors duration-150 ${
        active ? "text-accent-ink" : "text-ink-3 hover:text-ink"
      }`}
      onClick={onClick}
      type="button"
    >
      {active ? (
        <span className="bg-accent-tint absolute inset-x-1.5 inset-y-0 rounded-[10px]" />
      ) : null}
      <span className="relative flex size-5 items-center justify-center">
        {icon}
      </span>
      <span className="relative text-[9.5px] font-medium leading-none">
        {label}
      </span>
      {count ? (
        <span className="bg-accent text-surface absolute -right-0.5 top-0 rounded-full px-1 text-[9px] font-semibold leading-4">
          {count}
        </span>
      ) : null}
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
      className="bg-surface shadow-overlay fixed z-50 w-64 rounded-[14px] p-1.5"
      style={{
        top: position.top,
        left: position.left,
        animation: "pop-in 180ms cubic-bezier(0.23,1,0.32,1) both",
        transformOrigin: "top left",
      }}
    >
      <button
        className="hover:bg-hover flex h-10 w-full items-center gap-2 rounded-[8px] px-2 text-left"
        onClick={onManage}
        type="button"
      >
        <span className="bg-ink text-surface flex size-6 shrink-0 items-center justify-center rounded-[7px] text-[11px] font-semibold">
          {WORKSPACE.monogram}
        </span>
        <span className="text-ink min-w-0 flex-1 truncate text-[13.5px] font-medium">
          {WORKSPACE.name}
        </span>
        <span className="text-ink shrink-0">
          <IconCheckmark1Small size={18} />
        </span>
      </button>
      <div className="bg-line my-1 h-px" />
      <button
        className="hover:bg-hover flex h-9 w-full items-center gap-2 rounded-[8px] px-2 text-left"
        onClick={onManage}
        type="button"
      >
        <span className="text-ink-2 flex size-5 shrink-0 items-center justify-center">
          <IconSettingsGear1 size={16} />
        </span>
        <span className="text-ink min-w-0 flex-1 truncate text-[13.5px]">
          接続を管理
        </span>
      </button>
      <div className="bg-line my-1 h-px" />
      <button
        className="hover:bg-hover flex h-9 w-full items-center gap-2 rounded-[8px] px-2 text-left"
        onClick={onSignOut}
        type="button"
      >
        <span className="text-ink-2 flex size-5 shrink-0 items-center justify-center">
          <IconArrowBoxLeft size={16} />
        </span>
        <span className="text-ink min-w-0 flex-1 truncate text-[13.5px]">
          {signOutLabel}
        </span>
      </button>
    </div>,
    document.body
  );
}

export default function SidebarNav({
  activeNav,
  onNavigate,
  connectCount,
  signOutLabel = "シェルを閉じる",
  onSignOut,
  fill = false,
  className = "",
}: SidebarNavProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspacePosition, setWorkspacePosition] = useState({
    top: 0,
    left: 0,
  });
  const monogramRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!workspaceOpen) {
      return;
    }
    const close = (event: PointerEvent) => {
      const target = event.target as Element;
      if (
        !target.closest("[data-workspace-trigger]") &&
        !target.closest("[data-workspace-menu]")
      ) {
        setWorkspaceOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
    };
  }, [workspaceOpen]);

  return (
    <aside
      aria-label="Workspace navigation"
      className={`border-line flex w-[60px] shrink-0 flex-col items-center gap-1 border-r px-1.5 py-3 ${
        fill ? "h-full" : "h-[600px]"
      } ${className}`}
    >
      <button
        aria-expanded={workspaceOpen}
        className="bg-ink text-surface mb-3 flex size-8 items-center justify-center rounded-[9px] text-[13px] font-bold"
        data-workspace-trigger
        onClick={() => {
          if (!workspaceOpen && monogramRef.current) {
            const rect = monogramRef.current.getBoundingClientRect();
            setWorkspacePosition({ top: rect.bottom + 6, left: rect.left });
          }
          setWorkspaceOpen((open) => !open);
        }}
        ref={monogramRef}
        type="button"
      >
        {WORKSPACE.monogram}
      </button>

      {workspaceOpen ? (
        <WorkspaceMenu
          onManage={() => {
            setWorkspaceOpen(false);
            onNavigate?.("connect");
          }}
          onSignOut={() => {
            setWorkspaceOpen(false);
            onSignOut?.();
          }}
          position={workspacePosition}
          signOutLabel={signOutLabel}
        />
      ) : null}

      {NAV_ITEMS.map((item) => (
        <RailItem
          active={activeNav === item.key}
          count={item.key === "connect" ? connectCount : undefined}
          icon={item.icon}
          key={item.key}
          label={item.label}
          onClick={() => {
            onNavigate?.(item.key);
          }}
        />
      ))}
    </aside>
  );
}
