"use client";

import Link from "next/link";

interface MobileNavProperties {
  current: "connect" | "editor" | "projects";
}

export const MobileNav = ({ current }: MobileNavProperties) => (
  <nav className="hand-nav" aria-label="移動">
    <Link
      className={`btn ${current === "connect" ? "btn-solid" : "btn-ghost"}`}
      href="/connect"
    >
      接続
    </Link>
    <Link
      className={`btn ${current === "projects" ? "btn-solid" : "btn-ghost"}`}
      href="/projects"
    >
      一覧
    </Link>
    <Link
      className={`btn ${current === "editor" ? "btn-solid" : "btn-ghost"}`}
      href="/p/task-board"
    >
      作業
    </Link>
  </nav>
);
