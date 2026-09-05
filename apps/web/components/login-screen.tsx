"use client";

import { useRouter } from "next/navigation";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import { SERVICES } from "../lib/services";
import { BrandMark } from "./brand-mark";

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
        <section className="login">
          <div className="login-hero">
            <p className="nav-brand">ADHD Stack</p>
            <div>
              <p className="kicker">Connect once. Build anything.</p>
              <h1>
                何も考えずに、
                <br />
                始める。
              </h1>
              <p className="lede">
                OpenAI・GitHub・Cloudflare・Convex
                をつなぐだけ。チャットで話すと、コードが書き換わり、自分の環境に公開される。IDEは開かない。
              </p>
              <div className="logo-row" aria-label="つなぐサービス">
                {SERVICES.map((service) => (
                  <span key={service.id}>
                    <BrandMark alt="" size={28} src={service.logo} />
                  </span>
                ))}
                <span className="lede">4つの接続で完結</span>
              </div>
            </div>
            <p className="lede">adhd.gawarago.com</p>
          </div>
          <div className="login-panel">
            <div className="login-card">
              <h2>サインイン</h2>
              <p className="lede">
                Google
                アカウントでログインします。続けて4つのサービスを接続します。
              </p>
              <button className="btn btn-solid" onClick={enter} type="button">
                <BrandMark alt="" size={18} src="/brands/google.svg" />
                Googleで続ける
              </button>
              <p className="lede">
                続行すると利用規約に同意したことになります。モック ·
                認証情報は保存されません。
              </p>
            </div>
          </div>
        </section>
      </div>
      <div className="hand">
        <section className="hand-page">
          <p className="kicker">Connect once. Build anything.</p>
          <h1>何も考えずに、始める。</h1>
          <p className="lede">
            Googleで入って、4つつなぐだけ。IDEは開きません。
          </p>
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
