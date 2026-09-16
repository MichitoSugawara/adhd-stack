import { PublishScreen } from "../../../../components/screens/publish-screen";

interface PageProperties {
  params: Promise<{ project: string }>;
}

export default async function ProjectPublishPage({ params }: PageProperties) {
  const { project } = await params;
  return <PublishScreen appId={project} />;
}
