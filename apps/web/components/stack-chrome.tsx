"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { useMockApp } from "../lib/mock-store";
import { applyTheme, readChoice, subscribeTheme } from "../lib/theme";
import type { ThemeChoice } from "../lib/theme";

interface StackChromeProperties {
  current?: "connect" | "projects";
}

const choiceSnapshot = (): ThemeChoice => readChoice();
const choiceServer = (): ThemeChoice => "auto";

export const StackChrome = ({ current }: StackChromeProperties) => {
  const { loadDemo, signOut, state } = useMockApp();
  const router = useRouter();
  const choice = useSyncExternalStore(
    subscribeTheme,
    choiceSnapshot,
    choiceServer
  );
  const email = state.session?.email ?? "michito@gmail.com";
  const initials = state.session?.name ?? "MS";

  return (
    <header className="nav">
      <Link className="nav-brand" href={state.session ? "/projects" : "/"}>
        ADHD Stack
      </Link>
      {state.session ? (
        <>
          <Link
            aria-current={current === "connect" ? "page" : undefined}
            href="/connect"
          >
            接続
          </Link>
          <Link
            aria-current={current === "projects" ? "page" : undefined}
            href="/projects"
          >
            プロジェクト
          </Link>
          <span className="nav-user">
            {email}
            <span className="avatar">{initials}</span>
          </span>
        </>
      ) : null}
      <div className="topbar-actions">
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
