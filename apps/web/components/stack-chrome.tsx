"use client";

import { MoonIcon, StackIcon, SunIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";

import { useMockApp } from "../lib/mock-store";
import { applyTheme, readTheme, subscribeTheme } from "../lib/theme";
import type { ThemeName } from "../lib/theme";

interface StackChromeProperties {
  progress?: string;
}

const themeSnapshot = (): ThemeName => readTheme();
const themeServer = (): ThemeName => "light";

export const StackChrome = ({ progress }: StackChromeProperties) => {
  const { loadDemo, signOut, state } = useMockApp();
  const router = useRouter();
  const theme = useSyncExternalStore(
    subscribeTheme,
    themeSnapshot,
    themeServer
  );

  const toggle = () => {
    applyTheme(theme === "dark" ? "light" : "dark");
  };

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
        <button
          aria-label="配色を切り替える"
          className="btn btn-ghost"
          onClick={toggle}
          type="button"
        >
          {theme === "dark" ? (
            <SunIcon size={16} weight="duotone" />
          ) : (
            <MoonIcon size={16} weight="duotone" />
          )}
        </button>
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
              一覧
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
              出る
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
};
