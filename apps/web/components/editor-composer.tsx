"use client";

import {
  MicrophoneIcon,
  PaperPlaneTiltIcon,
  StopIcon,
} from "@phosphor-icons/react";

interface EditorComposerProperties {
  busy: boolean;
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  placeholder: string;
}

export const EditorComposer = ({
  busy,
  draft,
  onDraft,
  onSend,
  onStop,
  placeholder,
}: EditorComposerProperties) => (
  <form
    className="composer card elev-sm"
    onSubmit={(event) => {
      event.preventDefault();
      if (busy) {
        onStop();
        return;
      }
      onSend();
    }}
  >
    <label className="sr-only" htmlFor="talk">
      続きを話す
    </label>
    <input
      id="talk"
      onChange={(event) => onDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          if (busy) {
            onStop();
            return;
          }
          onSend();
        }
      }}
      placeholder={placeholder}
      value={draft}
    />
    <button className="btn btn-icon btn-ghost" title="音声入力" type="button">
      <MicrophoneIcon size={20} weight="duotone" />
    </button>
    <button className="btn btn-icon btn-primary" type="submit">
      {busy ? (
        <StopIcon size={16} weight="fill" />
      ) : (
        <PaperPlaneTiltIcon size={16} weight="fill" />
      )}
    </button>
  </form>
);
