"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

export const AuthTicket = () => {
  const searchParams = useSearchParams();
  const { signIn } = useAuthActions();
  const ticket = searchParams.get("ticket");
  const started = useRef(false);

  useEffect(() => {
    if (!ticket || started.current) {
      return;
    }
    started.current = true;
    const complete = async () => {
      await signIn("ticket", { ticket });
      window.history.replaceState(null, "", "/");
    };
    void complete();
  }, [signIn, ticket]);

  if (!ticket) {
    return null;
  }

  return (
    <p className="sr-only" role="status">
      ログインを完了しています
    </p>
  );
};
