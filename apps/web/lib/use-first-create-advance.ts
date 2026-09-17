"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { clearConnectionReturn } from "@/lib/connection-return";
import {
  firstCreateHref,
  markFirstActivationConsumed,
  readFirstActivationConsumed,
  shouldAdvanceToFirstCreate,
} from "@/lib/first-activation";

export const useFirstCreateAdvance = ({
  allConnected,
  hasLastWorkspace,
  workspaceCount,
}: {
  allConnected: boolean;
  hasLastWorkspace: boolean;
  workspaceCount: number | null;
}): void => {
  const router = useRouter();
  const advance = shouldAdvanceToFirstCreate({
    allConnected,
    consumed: readFirstActivationConsumed(),
    hasLastWorkspace,
    workspaceCount,
  });

  useEffect(() => {
    if (!advance) {
      return;
    }
    markFirstActivationConsumed();
    clearConnectionReturn();
    router.replace(firstCreateHref());
  }, [advance, router]);
};
