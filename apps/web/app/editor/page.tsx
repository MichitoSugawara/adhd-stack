import { EditorScreen } from "../../components/editor-screen";
import { SetupBanner } from "../../components/setup-banner";
import { hasConvexUrl } from "../../lib/env";

export default function EditorPage() {
  if (!hasConvexUrl()) {
    return <SetupBanner />;
  }
  return <EditorScreen />;
}
