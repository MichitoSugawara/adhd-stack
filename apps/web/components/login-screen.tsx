"use client";

import { useRouter } from "next/navigation";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import { SERVICES } from "../lib/services";
import { BrandMark } from "./brand-mark";
import { StackChrome } from "./stack-chrome";

export const LoginScreen = () => {
  const { signIn, state } = useMockApp();
  const router = useRouter();

  const enter = () => {
    if (!state.session) {
      signIn();
    }
    router.push("/connect");
  };

  return (
    <main className={`stack ${fontVariables}`}>
      <div className="desk">
        <StackChrome />
        <section className="login">
          <div className="login-hero">
            <p className="kicker">ADHD STACK</p>
            <h1>何も考えずに、始める。</h1>
            <p className="lede">
              Googleで入って、4つつなぐ。あとは話すだけ。IDEは開きません。
            </p>
            <div className="logo-row" aria-label="つなぐサービス">
              {SERVICES.map((service) => (
                <span key={service.id}>
                  <BrandMark alt="" size={22} src={service.logo} />
                </span>
              ))}
            </div>
          </div>
          <div className="login-panel">
            <div className="login-card">
              <h2>続ける</h2>
              <p className="lede">モックです。実ログインはしません。</p>
              <button className="btn btn-solid" onClick={enter} type="button">
                <BrandMark alt="" size={18} src="/brands/google.svg" />
                Googleで続ける
              </button>
            </div>
          </div>
        </section>
      </div>
      <div className="hand">
        <section className="hand-page">
          <p className="kicker">ADHD STACK</p>
          <h1>何も考えずに、始める。</h1>
          <p className="lede">Googleで入って、4つつなぐだけ。</p>
          <div className="logo-row" aria-label="つなぐサービス">
            {SERVICES.map((service) => (
              <span key={service.id}>
                <BrandMark alt="" size={22} src={service.logo} />
              </span>
            ))}
          </div>
          <button className="btn btn-solid" onClick={enter} type="button">
            <BrandMark alt="" size={18} src="/brands/google.svg" />
            Googleで続ける
          </button>
        </section>
      </div>
    </main>
  );
};
