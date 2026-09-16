"use client";

import { useRouter } from "next/navigation";

import { BrandMark } from "@/components/shell/brand-mark";
import { SERVICES } from "@/lib/services";
import { useShell } from "@/lib/shell-state";

const STEPS = [
  { key: "connect", label: "4つのサービスをつなぐ" },
  { key: "name", label: "名前を付けて作る" },
  { key: "chat", label: "チャットで進める" },
  { key: "publish", label: "自分の環境に出す" },
] as const;

export const LoginScreen = () => {
  const router = useRouter();
  const shell = useShell();

  const enter = () => {
    shell.enterShell();
    router.push("/connect");
  };

  return (
    <main className="bg-page text-ink flex min-h-dvh items-center justify-center px-6 py-12">
      <section className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[1.15fr_380px]">
        <div className="flex flex-col justify-center gap-7">
          <div className="flex items-center gap-2.5">
            <span className="rounded-control bg-accent text-on-accent flex size-7 items-center justify-center text-[13px] font-semibold">
              A
            </span>
            <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
              ADHD Stack
            </p>
          </div>
          <div>
            <h1 className="text-[44px] leading-[1.1] font-semibold tracking-tight">
              何も考えずに、
              <br />
              始める。
            </h1>
            <p className="text-ink-2 mt-5 max-w-md text-[15px] leading-7">
              ChatGPT、GitHub、Cloudflare、Convex
              をつなぎ、チャットで作って、自分の環境に出す。IDE は開かない。
            </p>
          </div>
          <ol className="flex max-w-md flex-col gap-2">
            {STEPS.map((step, index) => (
              <li
                className="rounded-card bg-surface shadow-card flex items-center gap-3 px-3.5 py-2.5"
                key={step.key}
              >
                <span className="bg-accent-tint text-accent-ink flex size-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums">
                  {index + 1}
                </span>
                <span className="text-[13.5px] font-medium">{step.label}</span>
              </li>
            ))}
          </ol>
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
            Google では入りません。最初の接続がセッションになります。
          </p>
          <button
            className="rounded-control bg-ink text-surface mt-6 flex h-12 w-full items-center justify-center text-[14px] font-medium transition-transform duration-150 active:scale-[0.99]"
            onClick={enter}
            type="button"
          >
            接続へ進む
          </button>
          <p className="text-ink-3 mt-5 text-[13px] leading-6">
            接続画面で、本物の認可だけを始めます。
          </p>
        </div>
      </section>
    </main>
  );
};
