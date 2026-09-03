"use client";

import { useRouter } from "next/navigation";

import { connectFontVariables } from "../lib/connect-fonts";
import { DemoBanner } from "./demo-banner";

interface EditorLockedProperties {
  waiting: boolean;
}

export const EditorLocked = ({ waiting }: EditorLockedProperties) => {
  const router = useRouter();
  return (
    <main className={`atelier locked-shell ${connectFontVariables}`}>
      <p className="chapter">
        <em>03</em> EDITOR
      </p>
      <h1>
        {waiting ? "デモ状態を読み込んでいます" : "作業面はまだ閉じています"}
      </h1>
      <p className="lede">
        {waiting
          ? "モックの4接続がそろうと、ファイル・活動・差分の3面が開きます。"
          : "接続カタログで4つのデモ接続をそろえてください。ログイン画面ではありません。"}
      </p>
      <DemoBanner />
      <button
        className="atelier-btn atelier-btn--solid"
        onClick={() => router.push("/")}
        type="button"
      >
        接続カタログへ
      </button>
    </main>
  );
};
