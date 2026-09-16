import { EditorScreen } from "../../../components/screens/editor-screen";

interface PageProperties {
  params: Promise<{ project: string }>;
}

export default async function ProjectEditorPage({ params }: PageProperties) {
  const { project } = await params;
  return <EditorScreen appId={project} />;
}
