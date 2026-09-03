"use client";

import { App as KonstaApp, Page as KonstaPage } from "konsta/react";
import { useRouter } from "next/navigation";

import { connectFontVariables } from "../lib/connect-fonts";
import { MOCK_REPO } from "../lib/mock-copy";
import { allConnectedOf, useMockApp } from "../lib/mock-store";
import { ActivityTimeline } from "./activity-timeline";
import { AtelierNav } from "./atelier-nav";
import { DemoBanner } from "./demo-banner";
import { ServiceCanvas } from "./service-canvas";
import { StageStrip } from "./stage-strip";

export const ProjectsScreen = () => {
  const { hydrated, state } = useMockApp();
  const router = useRouter();
  const ready = allConnectedOf(state.connections);
  const { workspace } = state;

  return (
    <>
      <main className={`atelier desktop-experience ${connectFontVariables}`}>
        <AtelierNav />
        <section className="atelier-hero" aria-labelledby="projects-title">
          <p className="chapter">
            <em>02</em> WORKSPACE
          </p>
          <h1 id="projects-title">プロジェクト</h1>
          <p className="lede">
            小さな依存グラフと、静かな活動列。実データは使いません。
          </p>
        </section>
        <StageStrip current="PROVISION" />
        <DemoBanner />
        <section className="project-desk">
          {hydrated && ready ? (
            <>
              <article className="project-summary">
                <strong>{MOCK_REPO.fullName}</strong>
                <small>リポジトリ · Codex環境 · Pages · Convex（モック）</small>
                <p>{workspace?.codexEnvironmentId ?? MOCK_REPO.envId}</p>
                <p>{workspace?.cloudflarePagesUrl ?? MOCK_REPO.pagesUrl}</p>
              </article>
              <ServiceCanvas />
              <ActivityTimeline />
              <button
                className="atelier-btn atelier-btn--solid"
                onClick={() => router.push("/editor")}
                type="button"
              >
                エディタを開く
              </button>
            </>
          ) : (
            <p className="lede">
              先に4つのデモ接続をすると、ここに作業場が出ます。
            </p>
          )}
          <button
            className="atelier-btn atelier-btn--ghost"
            onClick={() => router.push("/")}
            type="button"
          >
            接続カタログへ
          </button>
        </section>
      </main>
      <KonstaApp
        className={`atelier mobile-experience ${connectFontVariables}`}
        safeAreas
        theme="ios"
      >
        <KonstaPage className="mobile-page mobile-connect-page">
          <div className="mobile-scroll-content">
            <section
              className="atelier-hero atelier-hero--mobile"
              aria-labelledby="mobile-projects"
            >
              <p className="chapter">
                <em>02</em> WORKSPACE
              </p>
              <h1 id="mobile-projects">プロジェクト</h1>
              <p className="lede">モックの要約だけです。</p>
            </section>
            <StageStrip current="PROVISION" />
            <DemoBanner />
            {hydrated && ready ? (
              <>
                <article className="project-summary">
                  <strong>{MOCK_REPO.fullName}</strong>
                  <small>Repo / Env / Pages / Convex（モック）</small>
                </article>
                <ServiceCanvas />
                <ActivityTimeline />
              </>
            ) : (
              <p className="lede">先に4つのデモ接続をしてください。</p>
            )}
          </div>
          <div className="mobile-bottom-dock">
            <button
              className="atelier-btn atelier-btn--solid"
              onClick={() => router.push(ready ? "/editor" : "/")}
              type="button"
            >
              {ready ? "エディタを開く" : "接続へ"}
            </button>
          </div>
        </KonstaPage>
      </KonstaApp>
    </>
  );
};
