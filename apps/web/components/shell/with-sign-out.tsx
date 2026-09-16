"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import type { ReactNode } from "react";

import { hasConvexUrl } from "@/lib/env";
import { leaveShell } from "@/lib/shell-state";

interface WithSignOutProperties {
  children: (signOut: () => Promise<void>) => ReactNode;
}

const WithSignOutLive = ({ children }: WithSignOutProperties) => {
  const { signOut } = useAuthActions();
  return children(async () => {
    await signOut();
    leaveShell();
  });
};

export const WithSignOut = ({ children }: WithSignOutProperties) => {
  if (!hasConvexUrl()) {
    return children(() => {
      leaveShell();
      return Promise.resolve();
    });
  }
  return <WithSignOutLive>{children}</WithSignOutLive>;
};
