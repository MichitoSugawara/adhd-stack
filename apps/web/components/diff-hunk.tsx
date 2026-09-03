import type { DiffLineKind, MockDiffHunk } from "../lib/mock-types";

const gutterFor = (kind: DiffLineKind): string => {
  if (kind === "add") {
    return "+";
  }
  if (kind === "del") {
    return "−";
  }
  return " ";
};

interface DiffHunkListProperties {
  additions?: number;
  deletions?: number;
  hunks: MockDiffHunk[];
}

export const DiffHunkList = ({
  additions,
  deletions,
  hunks,
}: DiffHunkListProperties) => (
  <div className="diff-board">
    <p className="chat-diff-stats">
      Changed {hunks.length} files
      {additions === undefined ? null : (
        <em className="diff-add"> +{additions}</em>
      )}
      {deletions === undefined ? null : (
        <em className="diff-del"> −{deletions}</em>
      )}
    </p>
    {hunks.map((hunk) => (
      <section className="diff-hunk" key={hunk.file}>
        <header>{hunk.file}</header>
        <pre>
          {hunk.lines.map((line, index) => (
            <code
              className={`diff-line diff-line--${line.kind}`}
              key={`${hunk.file}-${index}-${line.text}`}
            >
              <span aria-hidden="true">{gutterFor(line.kind)}</span>
              {line.text}
            </code>
          ))}
        </pre>
      </section>
    ))}
  </div>
);
