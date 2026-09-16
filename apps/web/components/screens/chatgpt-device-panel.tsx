"use client";

import { useState } from "react";

interface ChatgptDevicePanelProperties {
  onCancel: () => void;
  onOpen: () => void;
  userCode: string;
}

export const ChatgptDevicePanel = ({
  onCancel,
  onOpen,
  userCode,
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
    <div className="mt-4">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <ol className="text-ink-2 list-decimal space-y-1 pl-5 text-[13px] leading-6">
          <li>コードをコピー</li>
          <li>入力ページを開く</li>
          <li>貼ると、この画面がつながります</li>
        </ol>
        <div className="min-w-0">
          <p className="text-ink-3 text-[12px]">確認コード</p>
          <p className="mt-2 font-mono text-[40px] leading-none tracking-[0.16em]">
            {userCode}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className="rounded-control bg-field text-ink h-9 px-3 text-[13px] font-medium"
              onClick={() => {
                void copyCode();
              }}
              type="button"
            >
              {copied ? "コピーした" : "コピー"}
            </button>
            <p className="text-ink-3 text-[12px]">あとで有効になります</p>
          </div>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          className="btn-accent rounded-control inline-flex h-10 items-center px-4 text-[13px] font-medium"
          onClick={onOpen}
          type="button"
        >
          入力ページを開く
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
        ChatGPT 側の入力を待っています。コードはこの画面に残ります。
      </p>
    </div>
  );
};
