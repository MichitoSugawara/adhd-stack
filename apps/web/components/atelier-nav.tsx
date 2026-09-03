"use client";

import { StackIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

interface AtelierNavProperties {
  onReset?: () => void;
  onStart?: () => void;
  starting?: boolean;
}

export const AtelierNav = ({
  onReset,
  onStart,
  starting,
}: AtelierNavProperties) => {
  const router = useRouter();
  return (
    <header className="atelier-nav">
      <div className="brand-lockup">
        <span className="brand-mark" aria-hidden="true">
          <StackIcon size={16} weight="bold" />
        </span>
        <span>ADHD Stack</span>
      </div>
      <div className="header-actions">
        <button
          className="atelier-btn atelier-btn--ghost"
          onClick={() => router.push("/projects")}
          type="button"
        >
          プロジェクト
        </button>
        {onStart ? (
          <button
            className="atelier-btn atelier-btn--ghost"
            disabled={starting}
            onClick={onStart}
            type="button"
          >
            デモを開始
          </button>
        ) : null}
        {onReset ? (
          <button
            className="atelier-btn atelier-btn--ghost"
            onClick={onReset}
            type="button"
          >
            デモをリセット
          </button>
        ) : null}
      </div>
    </header>
  );
};
