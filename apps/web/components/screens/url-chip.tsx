"use client";

import { useState } from "react";

const hostOf = (href: string): string => {
  try {
    const { host } = new URL(href);
    return host;
  } catch {
    return href;
  }
};

export const UrlChip = ({
  href,
  waiting,
}: {
  href: string;
  waiting?: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const host = hostOf(href);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <span className="rounded-chip bg-inset inline-flex max-w-full items-center gap-2 px-2.5 py-1 text-[13px]">
      <span
        className={
          waiting
            ? "bg-orange size-1.5 rounded-full"
            : "bg-accent size-1.5 rounded-full"
        }
      />
      <a
        className="text-ink min-w-0 truncate"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {host}
      </a>
      <button
        className="text-ink-3 hover:text-ink shrink-0 text-[12px]"
        onClick={() => {
          void copy();
        }}
        type="button"
      >
        {copied ? "コピーした" : "コピー"}
      </button>
      {waiting ? (
        <span className="text-ink-3 shrink-0 text-[12px]">
          完了はまだ見ていません
        </span>
      ) : null}
    </span>
  );
};
