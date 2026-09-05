"use client";

import type { Message } from "../lib/mock-types";

interface MessageViewProperties {
  message: Message;
  onApprove: (ok: boolean) => void;
  onChanges: () => void;
  onLimit: (reset: boolean) => void;
  onPick: (option: string) => void;
  onSecret: (ok: boolean) => void;
  previewName: string;
}

export const MessageView = ({
  message,
  onApprove,
  onChanges,
  onLimit,
  onPick,
  onSecret,
  previewName,
}: MessageViewProperties) => {
  if (message.kind === "user") {
    return <div className="msg msg-user">{message.body}</div>;
  }
  if (message.kind === "thinking") {
    return (
      <details className="msg msg-thinking" open>
        <summary>
          <span>考え中</span>
          <span>· {message.meta?.seconds ?? "2秒"}</span>
        </summary>
        <p>{message.body}</p>
      </details>
    );
  }
  if (message.kind === "ai") {
    return <p className="msg msg-ai">{message.body}</p>;
  }
  if (message.kind === "cmd") {
    const lines = message.meta?.lines ?? [
      message.meta?.command ?? message.body,
    ];
    return (
      <div className="card msg msg-cmd">
        {lines.map((line) => (
          <div key={line}>
            <span className="dollar">$</span> {line}
          </div>
        ))}
      </div>
    );
  }
  if (message.kind === "status") {
    return (
      <p className="msg msg-status">
        <span className="ticker" style={{ color: "var(--color-accent)" }}>
          ●
        </span>
        {message.body}
      </p>
    );
  }
  if (message.kind === "changes") {
    return (
      <div className="card msg msg-changes">
        <span style={{ display: "flex", justifyContent: "space-between" }}>
          <span>変更 · {message.body}</span>
          <button className="btn btn-ghost" onClick={onChanges} type="button">
            変更を見る →
          </button>
        </span>
        {(message.meta?.files ?? []).map((file) => (
          <span
            key={file.file}
            style={{
              color: "var(--color-neutral-700)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{file.file}</span>
            <span>
              <span style={{ color: "var(--color-accent-700)" }}>
                {file.add}
              </span>{" "}
              <span style={{ color: "var(--color-accent-2-700)" }}>
                {file.del}
              </span>
            </span>
          </span>
        ))}
      </div>
    );
  }
  if (message.kind === "question") {
    return (
      <div className="card elev-md msg msg-question">
        <span className="kicker" style={{ color: "var(--color-accent-2-700)" }}>
          あなたの返事を待っています
        </span>
        <span className="card-title" style={{ fontSize: 18 }}>
          {message.body}
        </span>
        <div style={{ display: "grid", gap: 8 }}>
          {(message.meta?.options ?? []).map((option) => (
            <button
              className="btn btn-secondary choice"
              key={option.label}
              onClick={() => onPick(option.label)}
              type="button"
            >
              <span>{option.label}</span>
              {option.note ? <small>{option.note}</small> : null}
            </button>
          ))}
        </div>
      </div>
    );
  }
  if (message.kind === "approval") {
    return (
      <div className="card elev-md msg msg-approval">
        <span className="tag tag-accent-2">確認が必要</span>
        <span className="card-title" style={{ fontSize: 18 }}>
          {message.body}
        </span>
        <p className="lede">{message.meta?.note}</p>
        <div
          className="mono"
          style={{ background: "var(--color-bg)", padding: "8px 12px" }}
        >
          {message.meta?.command}
        </div>
        <span>消す前に保存ポイントを自動で作ります。7日間戻せます</span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-ghost"
            onClick={() => onApprove(false)}
            type="button"
          >
            やめる（別の方法を頼む）
          </button>
          <button
            className="btn btn-primary"
            onClick={() => onApprove(true)}
            type="button"
          >
            消していい
          </button>
        </div>
      </div>
    );
  }
  if (message.kind === "secret") {
    return (
      <div className="card elev-md msg msg-secret">
        <span className="kicker">
          鍵を入れる · プレビュー「{previewName}」用
        </span>
        <label className="lede">
          STRIPE_SECRET_KEY
          <input
            className="input mono"
            placeholder="sk_test_…"
            type="password"
          />
        </label>
        <label className="lede">
          STRIPE_WEBHOOK_SECRET
          <input className="input mono" placeholder="whsec_…" type="password" />
        </label>
        <span className="lede">
          チャットの記録には残らず、環境ごとに暗号化して保存します。
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={() => onSecret(true)}
            type="button"
          >
            保存して続ける
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => onSecret(false)}
            type="button"
          >
            あとで
          </button>
        </div>
      </div>
    );
  }
  if (message.kind === "limit") {
    return (
      <div className="card msg msg-limit">
        <span className="tag tag-accent-2">今日の上限に達しました</span>
        <span className="card-title" style={{ fontSize: 18 }}>
          ここまでの作業は保存してあります。
        </span>
        <span>14:00 に自動で続きから再開します。</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={() => onLimit(false)}
            type="button"
          >
            14:00 に自動再開
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onLimit(true)}
            type="button"
          >
            別の鍵で続ける
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="card elev-md msg msg-published">
      <span className="card-kicker">{message.body}</span>
      <a href="https://adhd.gawarago.com">adhd.gawarago.com</a>
      <div style={{ display: "flex", gap: 8 }}>
        <a className="btn btn-primary" href="https://adhd.gawarago.com">
          開く
        </a>
        <button className="btn btn-secondary" type="button">
          URLをコピー
        </button>
      </div>
    </div>
  );
};
