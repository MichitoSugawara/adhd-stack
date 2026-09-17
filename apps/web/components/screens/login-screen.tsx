"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { StackLogo, WorkspaceIcon } from "@/components/shell/workspace-icon";
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
    <main className="welcome">
      <header className="welcome-header">
        <div className="welcome-wordmark">
          <StackLogo />
          <span>
            ADHD <strong>Stack</strong>
          </span>
        </div>
        <span className="welcome-header-note">A quieter place to build.</span>
      </header>
      <section className="welcome-body">
        <div>
          <p className="welcome-eyebrow">
            <WorkspaceIcon name="spark" size={15} /> FROM A LITTLE IDEA.
          </p>
          <h1>
            思いついたら、
            <br />
            もう、<span>つくれる。</span>
          </h1>
          <p className="welcome-description">
            頭の中の「こんなの欲しい」を、動くアプリに。
            <br />
            チャットでつくって、確かめて、そのまま公開。
            <br />
            あなたは、アイデアに集中するだけ。
          </p>
          <div className="welcome-cta">
            <button className="ui-button-primary" onClick={enter} type="button">
              つくりはじめる
              <WorkspaceIcon name="arrow" size={17} />
            </button>
            {shell.hydrated && shell.state.entered ? (
              <button
                className="welcome-return"
                type="button"
                onClick={() => router.push("/projects")}
              >
                ワークスペースに戻る →
              </button>
            ) : null}
          </div>
          <div className="welcome-services" aria-label="つなぐサービス">
            {SERVICES.map((service) => (
              <span className="welcome-service" key={service.id}>
                <Image src={service.logo} alt="" width={17} height={17} />
                {service.label}
              </span>
            ))}
          </div>
        </div>
        <div
          className="welcome-canvas"
          aria-label="アイデアからアプリが生まれるイメージ"
        >
          <div className="welcome-canvas-label">
            <span>IDEA → SOMETHING REAL</span>
            <span>01 / ∞</span>
          </div>
          <div className="welcome-thought">
            <span>
              <WorkspaceIcon name="spark" size={15} /> たとえば、こんなアイデア
            </span>
            <p>読みたい本を、ひとまとめにしたい。</p>
          </div>
          <span className="welcome-connector" />
          <div className="welcome-browser" aria-hidden="true">
            <div className="welcome-browser-bar">
              <i />
              <i />
              <i />
              <span>my little bookshelf</span>
            </div>
            <div className="welcome-browser-body">
              <div className="welcome-browser-rail">
                <i />
                <i />
                <i />
              </div>
              <div className="welcome-browser-content">
                <strong>わたしの本棚</strong>
                <span />
                <div className="welcome-note-line">
                  <i />
                  <span />
                </div>
                <div className="welcome-note-line">
                  <i />
                  <span />
                </div>
                <div className="welcome-note-line">
                  <i />
                  <span />
                </div>
              </div>
            </div>
          </div>
          <p className="welcome-caption">
            <WorkspaceIcon name="message" size={13} />{" "}
            ひとことから、少しずつ形に。
          </p>
        </div>
      </section>
      <footer className="welcome-footer">
        <div className="welcome-steps">
          <span>
            <b>01</b> つなぐ
          </span>
          <span>
            <b>02</b> つくる
          </span>
          <span>
            <b>03</b> 届ける
          </span>
        </div>
        <span>あなたのアカウント。あなたのアプリ。</span>
      </footer>
    </main>
  );
};
