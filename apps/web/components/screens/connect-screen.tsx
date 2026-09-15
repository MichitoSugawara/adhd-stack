"use client";

import { useRouter } from "next/navigation";

import { AppFrame } from "@/components/shell/app-frame";
import { BrandMark } from "@/components/shell/brand-mark";
import { ShellGate } from "@/components/shell/shell-gate";
import { SERVICES } from "@/lib/services";

export const ConnectScreen = () => {
  const router = useRouter();

  return (
    <ShellGate>
      <AppFrame>
        <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
              接続
            </p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-tight">
              4つをつなぎます
            </h1>
            <p className="text-ink-2 mt-2 text-[14px] leading-6">
              いまはどれもつながっていません。ボタンは Phase 2
              まで無効です。つながったように見せません。
            </p>
          </div>
          <p className="shell-note max-w-3xl">
            0 / 4 接続。ChatGPT はデバイスログイン、ほかは OpenConnector または
            interim OAuth。API キーカードはありません。
          </p>
          <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
            {SERVICES.map((service) => (
              <article
                className="rounded-card bg-surface shadow-card p-4"
                key={service.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <BrandMark alt="" src={service.logo} />
                  <span className="rounded-chip bg-field text-ink-3 px-2 py-1 text-[12px] font-medium">
                    未接続
                  </span>
                </div>
                <h2 className="mt-3 text-[16px] font-semibold">
                  {service.label}
                </h2>
                <p className="text-ink-2 mt-1 text-[13px] leading-5">
                  {service.body}
                </p>
                <button
                  className="rounded-control bg-field text-ink-3 mt-4 h-8 px-3 text-[13px] font-medium"
                  disabled
                  type="button"
                >
                  Phase 2 でつなぐ
                </button>
              </article>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-control bg-ink text-surface h-10 px-4 text-[13px] font-medium"
              onClick={() => {
                router.push("/projects");
              }}
              type="button"
            >
              一覧へ（シェル確認）
            </button>
            <p className="text-ink-3 self-center text-[13px]">
              未接続のまま、一覧の骨格を見ます。
            </p>
          </div>
        </main>
      </AppFrame>
    </ShellGate>
  );
};
