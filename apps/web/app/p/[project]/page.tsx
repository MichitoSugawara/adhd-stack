import { Suspense } from "react";

import { EditorScreen } from "../../../components/editor-screen";

interface PageProperties {
  params: Promise<{ project: string }>;
}

export default async function ProjectEditorPage({ params }: PageProperties) {
  const { project } = await params;
  return (
    <Suspense fallback={<p>読み込み中</p>}>
      <EditorScreen projectId={project} />
    </Suspense>
  );
}
