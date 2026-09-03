"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { api } from "../../../convex/_generated/api";

export const AuthTicket = () => {
  const searchParams = useSearchParams();
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const attachTicket = useMutation(api.accountMerge.attachTicket);
  const ticket = searchParams.get("ticket");
  const started = useRef(false);

  useEffect(() => {
    if (!ticket || started.current || isLoading) {
      return;
    }
    started.current = true;
    const complete = async () => {
      await (isAuthenticated
        ? attachTicket({ ticket })
        : signIn("ticket", { ticket }));
      window.history.replaceState(null, "", "/");
    };
    void complete();
  }, [attachTicket, isAuthenticated, isLoading, signIn, ticket]);

  if (!ticket) {
    return null;
  }

  return (
    <p className="sr-only" role="status">
      ログインを完了しています
    </p>
  );
};
