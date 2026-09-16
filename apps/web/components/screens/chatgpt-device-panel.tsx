"use client";

import { useState } from "react";

interface ChatgptDevicePanelProperties {
  onCancel: () => void;
  userCode: string;
  verificationUrl: string;
}

export const ChatgptDevicePanel = ({
  onCancel,
  userCode,
  verificationUrl,
}: ChatgptDevicePanelProperties) => {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(userCode);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="rounded-card bg-surface shadow-card mt-4 max-w-3xl p-5">
      <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
        ChatGPT
      </p>
      <h2 className="mt-1 text-[18px] font-semibold">コードを入力します</h2>
      <ol className="text-ink-2 mt-3 list-decimal space-y-1 pl-5 text-[13px] leading-6">
        <li>入力ページを開く</li>
        <li>下のコードを入れる</li>
        <li>戻ると、つながります</li>
      </ol>
      <p className="mt-5 font-mono text-[40px] leading-none tracking-[0.18em]">
        {userCode}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <a
          className="rounded-control bg-ink text-surface inline-flex h-10 items-center px-4 text-[13px] font-medium"
          href={verificationUrl}
          rel="noreferrer"
          target="_blank"
        >
          入力ページを開く
        </a>
        <button
          className="rounded-control bg-field text-ink h-10 px-3 text-[13px] font-medium"
          onClick={() => {
            void copyCode();
          }}
          type="button"
        >
          {copied ? "コピーした" : "コードをコピー"}
        </button>
        <button
          className="rounded-control text-ink-2 hover:bg-hover h-10 px-3 text-[13px]"
          onClick={onCancel}
          type="button"
        >
          やめる
        </button>
      </div>
      <p className="text-ink-3 mt-3 text-[13px]">
        ChatGPT 側の入力を待っています。この画面はつながるまで開いたままです。
      </p>
    </div>
  );
};
