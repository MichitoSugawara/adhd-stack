"use client";

import { connectFontVariables } from "../lib/connect-fonts";
import { useEditorWorkspace } from "../lib/use-editor-workspace";
import { useVisualViewport } from "../lib/use-visual-viewport";
import { EditorDesktopPane } from "./editor-desktop-pane";
import { EditorLocked } from "./editor-locked";
import { EditorMobilePane } from "./editor-mobile-pane";

export const EditorScreen = () => {
  useVisualViewport();
  const state = useEditorWorkspace();

  if (!state.board?.allConnected) {
    return <EditorLocked waiting={state.board === undefined} />;
  }

  return (
    <div className={connectFontVariables}>
      <EditorDesktopPane state={state} />
      <EditorMobilePane state={state} />
    </div>
  );
};
