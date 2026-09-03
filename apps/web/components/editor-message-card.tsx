import type { Doc } from "../../../convex/_generated/dataModel";
import { KIND_LABELS } from "../lib/editor-copy";

interface EditorMessageCardProperties {
  message: Doc<"messages">;
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
          {files.length === 0 ? <p>{message.body}</p> : null}
        </>
      ) : null}
      {message.kind === "command" || message.kind === "diff" ? null : (
        <p>{message.body}</p>
      )}
    </article>
  );
};
