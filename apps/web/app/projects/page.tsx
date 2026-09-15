import { Suspense } from "react";

import { ProjectsScreen } from "../../components/screens/projects-screen";

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="bg-page min-h-dvh" />}>
      <ProjectsScreen />
    </Suspense>
  );
}
