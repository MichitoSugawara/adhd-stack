"use client";

import type { ReactNode } from "react";

import { NeedSession } from "@/components/screens/need-session";
import { useShell } from "@/lib/shell-state";

export const ShellGate = ({ children }: { children: ReactNode }) => {
  const shell = useShell();

  if (!shell.hydrated) {
    return <div className="bg-page min-h-dvh" />;
  }

  if (!shell.state.entered) {
    return <NeedSession />;
  }

  return children;
};
