import { CreatingScreen } from "../../../../components/screens/creating-screen";

interface PageProperties {
  params: Promise<{ project: string }>;
}

export default async function CreatingPage({ params }: PageProperties) {
  const { project } = await params;
  return <CreatingScreen appId={project} />;
}
