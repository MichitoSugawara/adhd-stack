"use client";

import Link from "next/link";

import "./connections.css";

export const NeedSession = () => (
  <main className="connection-session">
    <div className="connection-session-card">
      <span aria-hidden="true" className="connection-session-mark">
        a.
      </span>
      <p className="ui-eyebrow">ADHD STACK</p>
      <h1>
        アイデアの続きを、
        <br />
        ここから。
      </h1>
      <p className="connection-session-description">
        はじめにアカウントをつなぎましょう。
        <br />
        あなたのアプリは、あなたの場所に。
      </p>
      <Link className="ui-button ui-button-primary" href="/">
        はじめる <span aria-hidden="true">→</span>
      </Link>
    </div>
  </main>
);
