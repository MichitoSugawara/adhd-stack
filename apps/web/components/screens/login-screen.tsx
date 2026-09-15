"use client";

import { useRouter } from "next/navigation";

import { BrandMark } from "@/components/shell/brand-mark";
import { SERVICES } from "@/lib/services";
import { useShell } from "@/lib/shell-state";

export const LoginScreen = () => {
  const router = useRouter();
  const shell = useShell();

  const enter = () => {
    shell.enterShell();
    router.push("/connect");
  };

  return (
    <main className="bg-page text-ink flex min-h-dvh items-center justify-center px-6 py-10">
      <section className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col justify-center gap-6">
          <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
            ADHD Stack
          </p>
          <div>
            <h1 className="text-[40px] leading-[1.1] font-semibold tracking-tight">
              何も考えずに、
              <br />
              始める。
            </h1>
            <p className="text-ink-2 mt-4 max-w-md text-[15px] leading-6">
              ChatGPT、GitHub、Cloudflare、Convex
              をつなぎ、チャットで作って、自分の環境に公開する。IDE は開かない。
            </p>
          </div>
          <div className="flex items-center gap-3" aria-label="つなぐサービス">
            {SERVICES.map((service) => (
              <BrandMark
                alt={service.label}
                key={service.id}
                src={service.logo}
              />
            ))}
            <span className="text-ink-3 text-[13px]">4つの接続で完結</span>
          </div>
          <p className="text-ink-3 text-[13px]">adhd.gawarago.com</p>
        </div>
        <div className="rounded-window bg-surface shadow-card p-6">
          <h2 className="text-[20px] font-semibold">シェルを開く</h2>
          <p className="text-ink-2 mt-2 text-[14px] leading-6">
            Google では入りません。最初の接続がセッションになります（Phase
            2）。いまは画面を辿るためのローカル状態だけです。
          </p>
          <button
            className="rounded-control bg-ink text-surface mt-6 flex h-12 w-full items-center justify-center text-[14px] font-medium transition-transform duration-150 active:scale-[0.99]"
            onClick={enter}
            type="button"
          >
            接続へ進む
          </button>
          <p className="shell-note mt-5">
            偽のログイン成功は出しません。OAuth は Phase 2 で配線します。
          </p>
        </div>
      </section>
    </main>
  );
};
