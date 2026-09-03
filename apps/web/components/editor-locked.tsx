"use client";

import { Button } from "@cloudflare/kumo";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

import { DemoBanner } from "./demo-banner";

interface EditorLockedProperties {
  waiting: boolean;
}

export const EditorLocked = ({ waiting }: EditorLockedProperties) => {
  const router = useRouter();
  return (
    <main className="login-shell desktop-experience">
      <section className="login-card" aria-labelledby="editor-locked-title">
        <p className="eyebrow">DEMO EDITOR LOCKED</p>
        <h1 id="editor-locked-title">
          {waiting ? "デモ状態を読み込んでいます" : "まだエディタは開けません"}
        </h1>
        <p className="login-description">
          {waiting
            ? "モックの接続がそろうと、ここにチャットが開きます。"
            : "接続画面で4つのデモ接続をそろえてください。"}
        </p>
        <DemoBanner />
        <Button
          className="back-button"
          icon={ArrowLeftIcon}
          onClick={() => router.push("/")}
          size="sm"
          variant="ghost"
        >
          接続へ戻る
        </Button>
      </section>
    </main>
  );
};
