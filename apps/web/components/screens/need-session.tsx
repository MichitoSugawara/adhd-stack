"use client";

import Link from "next/link";

export const NeedSession = () => (
  <main className="bg-page text-ink flex min-h-dvh items-center justify-center px-6">
    <div className="rounded-window bg-surface shadow-card w-full max-w-md p-6">
      <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
        ADHD Stack
      </p>
      <h1 className="mt-3 text-[28px] font-semibold tracking-tight">
        先に入口を開いてください
      </h1>
      <p className="text-ink-2 mt-2 text-[14px]">
        接続は、入口のあとで始めます。
      </p>
      <Link
        className="rounded-control bg-ink text-surface mt-6 inline-flex h-10 items-center px-4 text-[13px] font-medium"
        href="/"
      >
        入口へ
      </Link>
    </div>
  </main>
);
