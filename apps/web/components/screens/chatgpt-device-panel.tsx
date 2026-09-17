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
  const [copyStatus, setCopyStatus] = useState<"copied" | "failed" | "idle">(
    "idle"
  );

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(userCode);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  };

  return (
    <div className="connection-device">
      <div className="connection-device-heading">
        <span className="connection-device-number">01</span>
        <div>
          <h3>このコードを、ChatGPT に入力</h3>
          <p>入力ページで認可したら、この画面に戻ってください。</p>
        </div>
      </div>
      <div className="connection-device-code-row">
        <code aria-label="確認コード" className="connection-device-code">
          {userCode}
        </code>
        <button
          className="ui-button"
          onClick={() => {
            void copyCode();
          }}
          type="button"
        >
          {copyStatus === "copied" ? "コピーしました" : "コードをコピー"}
        </button>
      </div>
      {copyStatus === "failed" ? (
        <p className="connection-device-copy-error" role="status">
          コピーできませんでした。上のコードを選択してコピーしてください。
        </p>
      ) : null}
      <div className="connection-device-actions">
        <button
          className="ui-button ui-button-primary"
          onClick={onOpen}
          type="button"
        >
          入力ページを開く <span aria-hidden="true">↗</span>
        </button>
        <button
          className="ui-button connection-button-quiet"
          onClick={onCancel}
          type="button"
        >
          キャンセル
        </button>
      </div>
      <p className="connection-device-wait" role="status">
        <span aria-hidden="true" />
        ChatGPT 側の入力を待っています。接続できると自動で切り替わります。
      </p>
    </div>
  );
};
