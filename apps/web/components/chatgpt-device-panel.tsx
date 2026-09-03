"use client";

import { ArrowSquareOutIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

import type { ChatgptDevicePrompt } from "../lib/use-connect-board";

interface ChatgptDevicePanelProperties {
  device: ChatgptDevicePrompt;
  onCancel: () => void;
  onOpen: () => void;
}

const copyUserCode = async (userCode: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(userCode);
    return;
  }
  const field = document.createElement("textarea");
  field.value = userCode;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  document.execCommand("copy");
  field.remove();
};

export const ChatgptDevicePanel = ({
  device,
  onCancel,
  onOpen,
}: ChatgptDevicePanelProperties) => {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const handleCopy = async () => {
    try {
      await copyUserCode(device.userCode);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-labelledby="chatgpt-device-title"
      className="chatgpt-device-panel"
    >
      <p className="chatgpt-device-kicker">ChatGPT</p>
      <h2 id="chatgpt-device-title" ref={headingRef} tabIndex={-1}>
        このコードを入力
      </h2>
      <p className="chatgpt-device-lead">ログインしたらこのコードを入力</p>
      <p className="chatgpt-device-code" tabIndex={0}>
        {device.userCode}
      </p>
      <div className="chatgpt-device-actions">
        <button
          className="chatgpt-device-btn chatgpt-device-btn--ghost"
          onClick={() => {
            void handleCopy();
          }}
          type="button"
        >
          {copied ? (
            <CheckIcon aria-hidden="true" size={18} weight="bold" />
          ) : (
            <CopyIcon aria-hidden="true" size={18} weight="bold" />
          )}
          {copied ? "コピーした" : "コピー"}
        </button>
        <button
          className="chatgpt-device-btn chatgpt-device-btn--primary"
          onClick={onOpen}
          type="button"
        >
          <ArrowSquareOutIcon aria-hidden="true" size={18} weight="bold" />
          ChatGPT を開く
        </button>
        <button
          className="chatgpt-device-btn chatgpt-device-btn--secondary"
          onClick={onOpen}
          type="button"
        >
          もう一度開く
        </button>
      </div>
      <div className="chatgpt-device-footer">
        <p role="status">ChatGPT 側の確認を待っています</p>
        <button
          className="chatgpt-device-cancel"
          onClick={onCancel}
          type="button"
        >
          やめる
        </button>
      </div>
    </section>
  );
};
