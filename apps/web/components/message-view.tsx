"use client";

import type { Message } from "../lib/mock-types";

const KIND_LABEL = {
  approval: "確認",
  changes: "変更",
  cmd: "作業",
  limit: "上限",
  published: "反映",
  question: "質問",
  secret: "鍵と設定",
  thinking: "思考",
  user: "依頼",
} as const;

const changeMark = (kind: "add" | "ctx" | "del"): string => {
  if (kind === "add") {
    return "+";
  }
  if (kind === "del") {
    return "−";
  }
  return " ";
};

interface MessageViewProperties {
  message: Message;
  onApprove: () => void;
  onOverlap: () => void;
  onPick: (option: string) => void;
  onSecret: () => void;
}

export const MessageView = ({
  message,
  onApprove,
  onOverlap,
  onPick,
  onSecret,
}: MessageViewProperties) => (
  <article className={`msg msg-${message.kind}`}>
    <header>
      <span>{KIND_LABEL[message.kind]}</span>
      <time>デモ</time>
    </header>
    {message.kind === "cmd" ? (
      <pre className="mono">{message.meta?.command ?? message.body}</pre>
    ) : (
      <p>{message.body}</p>
    )}
    {message.kind === "changes" && message.meta?.files
      ? message.meta.files.map((file) => (
          <pre className="change" key={file.file}>
            <strong>{file.file}</strong>
            {file.lines.map((line) => (
              <code className={line.kind} key={`${file.file}-${line.text}`}>
                {changeMark(line.kind)}
                {line.text}
              </code>
            ))}
          </pre>
        ))
      : null}
    {message.kind === "question" && message.meta?.options ? (
      <div className="filters">
        {message.meta.options.map((option) => (
          <button
            className="btn btn-ghost"
            key={option}
            onClick={() => onPick(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    ) : null}
    {message.kind === "approval" ? (
      <div className="filters">
        <button className="btn btn-solid" onClick={onApprove} type="button">
          検証へ送る
        </button>
        <button className="btn btn-ghost" onClick={onOverlap} type="button">
          重なりを見る
        </button>
      </div>
    ) : null}
    {message.kind === "secret" ? (
      <button className="btn btn-solid" onClick={onSecret} type="button">
        鍵と設定へ
      </button>
    ) : null}
    {message.kind === "published" ? (
      <p className="mono">https://adhd.gawarago.com</p>
    ) : null}
  </article>
);
