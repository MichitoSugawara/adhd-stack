"use client";

import { StackIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { useMockApp } from "../lib/mock-store";
import { applyTheme, readChoice, subscribeTheme } from "../lib/theme";
import type { ThemeChoice } from "../lib/theme";

interface StackChromeProperties {
  progress?: string;
}

const choiceSnapshot = (): ThemeChoice => readChoice();
const choiceServer = (): ThemeChoice => "auto";

export const StackChrome = ({ progress }: StackChromeProperties) => {
  const { loadDemo, signOut, state } = useMockApp();
  const router = useRouter();
  const choice = useSyncExternalStore(
    subscribeTheme,
    choiceSnapshot,
    choiceServer
  );

  return (
    <header className="topbar">
      <Link className="brand" href={state.session ? "/projects" : "/"}>
        <i aria-hidden="true">
          <StackIcon size={16} weight="duotone" />
        </i>
        ADHD Stack
      </Link>
      <div className="topbar-actions">
        {progress ? <span className="progress-pill">{progress}</span> : null}
        <div className="seg" aria-label="配色">
          <button
            className={`seg-opt ${choice === "light" ? "is-on" : ""}`}
            onClick={() => applyTheme("light")}
            type="button"
          >
            明
          </button>
          <button
            className={`seg-opt ${choice === "dark" ? "is-on" : ""}`}
            onClick={() => applyTheme("dark")}
            type="button"
          >
            暗
          </button>
          <button
            className={`seg-opt ${choice === "auto" ? "is-on" : ""}`}
            onClick={() => applyTheme("auto")}
            type="button"
          >
            自動
          </button>
        </div>
        {state.session ? (
          <>
            <button
              className="btn btn-ghost"
              onClick={() => router.push("/connect")}
              type="button"
            >
              接続
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => router.push("/projects")}
              type="button"
            >
              プロジェクト
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                loadDemo();
                router.push("/projects");
              }}
              type="button"
            >
              デモ一式
            </button>
            <button className="btn btn-ghost" onClick={signOut} type="button">
              ログアウト
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
};
