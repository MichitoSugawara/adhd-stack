import { ProjectsScreen } from "../../components/projects-screen";
import { SetupBanner } from "../../components/setup-banner";
import { hasConvexUrl } from "../../lib/env";

export default function ProjectsPage() {
  if (!hasConvexUrl()) {
    return <SetupBanner />;
  }
  return <ProjectsScreen />;
}
