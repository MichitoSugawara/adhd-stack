"use client";

interface EditorComposerProperties {
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
}

export const EditorComposer = ({
  draft,
  onDraft,
  onSend,
}: EditorComposerProperties) => (
  <form
    className="composer"
    onSubmit={(event) => {
      event.preventDefault();
      onSend();
    }}
  >
    <label className="sr-only" htmlFor="talk">
      作りたいもの
    </label>
    <textarea
      id="talk"
      onChange={(event) => onDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSend();
        }
      }}
      placeholder="作りたいものを話す"
      rows={2}
      value={draft}
    />
    <button
      className="btn btn-solid"
      disabled={draft.trim().length === 0}
      type="submit"
    >
      送る
    </button>
  </form>
);
