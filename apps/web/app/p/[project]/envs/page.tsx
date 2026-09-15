import { EnvsScreen } from "../../../../components/screens/envs-screen";

interface PageProperties {
  params: Promise<{ project: string }>;
}

export default async function EnvsPage({ params }: PageProperties) {
  const { project } = await params;
  return <EnvsScreen appId={project} />;
}
