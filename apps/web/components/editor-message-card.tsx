import { KIND_LABELS } from "../lib/editor-copy";
import type { MockMessage } from "../lib/mock-types";

interface EditorMessageCardProperties {
  message: MockMessage;
}

export const EditorMessageCard = ({ message }: EditorMessageCardProperties) => {
  const label = KIND_LABELS[message.kind];
  const files = message.meta?.files ?? [];
  const command = message.meta?.command ?? message.body;
  const additions = message.meta?.additions;
  const deletions = message.meta?.deletions;

  return (
    <article
      className={`chat-message chat-message--${message.role} chat-message--${message.kind}`}
    >
      {label ? <p className="editor-label">{label}</p> : null}
      {message.kind === "command" ? (
        <pre className="chat-command">{command}</pre>
      ) : null}
      {message.kind === "diff" ? (
        <>
          <p className="chat-diff-stats">
            {additions === undefined ? null : `+${additions}`}
            {deletions === undefined ? null : ` −${deletions}`}
          </p>
          <ul className="chat-file-list">
            {files.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
          <p>{message.body}</p>
        </>
      ) : null}
      {message.kind === "command" || message.kind === "diff" ? null : (
        <p>{message.body}</p>
      )}
    </article>
  );
};
