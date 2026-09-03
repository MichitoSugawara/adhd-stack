"use client";

import { Button } from "@cloudflare/kumo";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";

interface EditorLockedProperties {
  waiting: boolean;
}

export const EditorLocked = ({ waiting }: EditorLockedProperties) => {
  const router = useRouter();
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="editor-locked-title">
        <p className="eyebrow">EDITOR LOCKED</p>
        <h1 id="editor-locked-title">
          {waiting ? "接続を確認しています" : "まだエディタは開けません"}
        </h1>
        <p className="login-description">
          {waiting
            ? "4つの接続がそろうと、ここにチャットが開きます。"
            : "4つそろうまで、接続の画面でノードをつないでください。"}
        </p>
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
