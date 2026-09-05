"use client";

import Link from "next/link";

import { fontVariables } from "../lib/fonts";
import { StackChrome } from "./stack-chrome";

export const NeedSession = () => (
  <main className={`stack ${fontVariables}`}>
    <StackChrome />
    <section className="page">
      <h1>先に入ってください</h1>
      <Link className="btn btn-solid" href="/">
        ログインへ
      </Link>
    </section>
  </main>
);
