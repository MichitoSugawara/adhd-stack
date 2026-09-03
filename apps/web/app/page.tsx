import { Suspense } from "react";

import { AuthTicket } from "../components/auth-ticket";
import { ConnectScreen } from "../components/connect-screen";
import { SetupBanner } from "../components/setup-banner";
import { hasConvexUrl } from "../lib/env";

export default function Home() {
  if (!hasConvexUrl()) {
    return <SetupBanner />;
  }
  return (
    <Suspense fallback={null}>
      <AuthTicket />
      <ConnectScreen />
    </Suspense>
  );
}
