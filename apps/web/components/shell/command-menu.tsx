"use client";

import { useEffect, useRef, useState } from "react";

import type { SidebarRecent } from "@/components/primitives/SidebarNav";
import { WorkspaceIcon } from "@/components/shell/workspace-icon";
import type { WorkspaceIconName } from "@/components/shell/workspace-icon";

// Circle command palette + OpenTUI focus-scoped keymaps, adapted to a native web dialog.
// https://github.com/ln-dev7/circle/blob/master/components/layout/command-palette.tsx
// https://github.com/anomalyco/opentui/tree/main/packages/keymap
const commands: {
  label: string;
  href: string;
  icon: WorkspaceIconName;
  detail: string;
}[] = [
  {
    detail: "アイデアから始める",
    href: "/new",
    icon: "plus",
    label: "新しいアプリ",
  },
  {
    detail: "つづきから作る",
    href: "/projects",
    icon: "apps",
    label: "アプリ一覧",
  },
  {
    detail: "サービスとアカウント",
    href: "/connect",
    icon: "connect",
    label: "接続",
  },
];

export const CommandMenu = ({
  open,
  onClose,
  onNavigate,
  recents,
  creatingIds,
  envHref = null,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
  recents: SidebarRecent[];
  creatingIds: string[];
  envHref?: string | null;
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const creating = new Set(creatingIds);
  const list = [
    ...commands,
    ...(envHref
      ? [
          {
            detail: "プレビューと本番",
            href: envHref,
            icon: "globe" as const,
            label: "環境",
          },
        ]
      : []),
    ...recents.map((item) => ({
      detail: "アプリを開く",
      href: `/p/${item.id}${creating.has(item.id) ? "/creating" : ""}`,
      icon: "message" as const,
      label: item.label,
    })),
  ].filter((item) =>
    `${item.label} ${item.detail}`
      .toLowerCase()
      .includes(query.toLowerCase().trim())
  );
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      search.current?.focus();
    } else {
      dialog.current?.close();
    }
  }, [open]);
  const choose = (href: string) => {
    onClose();
    setQuery("");
    onNavigate(href);
  };
  return (
    <dialog
      ref={dialog}
      className="command-menu"
      aria-labelledby="command-title"
      onClose={onClose}
      onCancel={onClose}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) {
          return;
        }
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
          return;
        }
        event.preventDefault();
        const buttons = [
          ...(dialog.current?.querySelectorAll<HTMLButtonElement>(
            "[data-command]"
          ) ?? []),
        ];
        const current =
          document.activeElement instanceof HTMLButtonElement
            ? buttons.indexOf(document.activeElement)
            : -1;
        let next = (current + 1) % buttons.length;
        if (event.key === "ArrowUp") {
          next =
            current < 0
              ? buttons.length - 1
              : (current - 1 + buttons.length) % buttons.length;
        }
        buttons[next]?.focus();
      }}
    >
      <h2 className="sr-only" id="command-title">
        検索と移動
      </h2>
      <div className="command-search">
        <WorkspaceIcon name="search" size={20} />
        <input
          ref={search}
          aria-label="アプリや操作を検索"
          placeholder="どこへ移動しますか？"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.nativeEvent.isComposing &&
              list[0]
            ) {
              choose(list[0].href);
            }
          }}
        />
        <button
          className="ui-icon-button"
          type="button"
          onClick={onClose}
          aria-label="検索を閉じる"
        >
          <kbd>esc</kbd>
        </button>
      </div>
      <div className="command-results">
        <p className="ui-eyebrow">{query ? "検索結果" : "QUICK ACTIONS"}</p>
        {list.map((item) => (
          <button
            data-command
            key={item.href}
            type="button"
            onClick={() => choose(item.href)}
          >
            <WorkspaceIcon name={item.icon} />
            <span>
              {item.label}
              <small>{item.detail}</small>
            </span>
            <WorkspaceIcon name="arrow" size={15} />
          </button>
        ))}
        {list.length === 0 ? (
          <p className="command-empty">
            見つかりませんでした。別の名前で探してみてください。
          </p>
        ) : null}
      </div>
      <div className="command-footer">
        <span>
          <kbd>↑</kbd>
          <kbd>↓</kbd> 移動
        </span>
        <span>
          <kbd>↵</kbd> 開く
        </span>
        <span>
          <kbd>esc</kbd> 閉じる
        </span>
      </div>
    </dialog>
  );
};
