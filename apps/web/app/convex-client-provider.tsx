"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";

import { convexUrl } from "../lib/env";

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

interface ConvexClientProviderProperties {
  children: ReactNode;
}

export const ConvexClientProvider = ({
  children,
}: ConvexClientProviderProperties) => {
  if (!convex) {
    return children;
  }
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>;
};
