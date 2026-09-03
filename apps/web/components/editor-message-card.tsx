import { KIND_LABELS } from "../lib/editor-copy";
import type { MockMessage } from "../lib/mock-types";
import { DiffHunkList } from "./diff-hunk";

interface EditorMessageCardProperties {
  message: MockMessage;
}

export const EditorMessageCard = ({ message }: EditorMessageCardProperties) => {
  const label = KIND_LABELS[message.kind];
  const command = message.meta?.command ?? message.body;
  const hunks = message.meta?.hunks ?? [];
  const isUser = message.role === "user";

  return (
    <article
      className={`timeline-row timeline-row--${message.kind} ${isUser ? "is-user" : ""}`}
    >
      <i aria-hidden="true" />
      <div>
        <header>
          <span>{label || (isUser ? "依頼" : "返答")}</span>
          <time>デモ</time>
        </header>
        {message.kind === "command" ? (
          <pre className="chat-command">{command}</pre>
        ) : null}
        {message.kind === "diff" ? (
          <DiffHunkList
            additions={message.meta?.additions}
            deletions={message.meta?.deletions}
            hunks={hunks}
          />
        ) : null}
        {message.kind === "command" || message.kind === "diff" ? null : (
          <p>{message.body}</p>
        )}
      </div>
    </article>
  );
};
