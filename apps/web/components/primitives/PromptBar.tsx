"use client";

import { useLayoutEffect, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────
 * PROMPT BAR
 * One rounded composer: a growing textarea and a circular
 * send button. Nothing else to decide — type and send.
 * ───────────────────────────────────────────────────────── */

export default function PromptBar({
  placeholder,
  onSend,
  disabled = false,
  sendLabel,
}: {
  variant?: string;
  /** the self-running walkthrough; turn off when embedding in a real surface */
  demo?: boolean;
  /** hero sizing: a multi-line input with controls on their own row */
  tall?: boolean;
  placeholder?: string;
  onSend?: (text: string) => void;
  disabled?: boolean;
  sendLabel?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* grow with content up to a compact maximum */
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    const maxHeight = 120;
    input.style.height = "0px";
    const contentHeight = input.scrollHeight;
    input.style.height = `${Math.min(Math.max(contentHeight, 24), maxHeight)}px`;
    input.style.overflowY = contentHeight > maxHeight ? "auto" : "hidden";
  }, [draft]);

  const canSend = !disabled && draft.trim().length > 0;
  const send = () => {
    if (!canSend) {
      return;
    }
    onSend?.(draft.trim());
    setDraft("");
  };

  return (
    <div className="border-line bg-surface shadow-card flex items-end gap-2 rounded-[20px] border p-2 pl-4 transition-[border-color] duration-150 focus-within:border-[var(--line-strong)]">
      <textarea
        aria-label={placeholder}
        className="text-ink placeholder:text-ink-3 max-h-[120px] min-h-6 min-w-0 flex-1 resize-none bg-transparent py-1 text-[14px] leading-[22px] outline-none [overflow-wrap:anywhere]"
        disabled={disabled}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            send();
          }
        }}
        placeholder={placeholder}
        ref={inputRef}
        rows={1}
        value={draft}
      />
      <button
        aria-label={sendLabel ?? "送信"}
        className="bg-ink text-surface flex size-9 shrink-0 items-center justify-center rounded-full transition-[transform,opacity] duration-150 active:scale-95 disabled:opacity-30"
        disabled={!canSend}
        onClick={send}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="15"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
          width="15"
        >
          <path d="M12 19V5m-6 6 6-6 6 6" />
        </svg>
      </button>
    </div>
  );
}
