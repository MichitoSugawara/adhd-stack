"use client";

import { Button } from "@cloudflare/kumo";
import { ArrowLeftIcon, StackIcon } from "@phosphor-icons/react";
import {
  App as KonstaApp,
  Button as KonstaButton,
  Page as KonstaPage,
} from "konsta/react";
import { useRouter } from "next/navigation";

import { connectFontVariables } from "../lib/connect-fonts";
import { MOCK_REPO } from "../lib/mock-copy";
import { allConnectedOf, useMockApp } from "../lib/mock-store";
import { ActivityTimeline } from "./activity-timeline";
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
      <main
        className={`projects-shell desktop-experience ${connectFontVariables}`}
      >
        <header className="product-header">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <StackIcon size={19} weight="bold" />
            </span>
            <span>ADHD Stack</span>
          </div>
        </header>
        <section className="projects-page" aria-labelledby="projects-title">
          <div className="projects-heading">
            <div>
              <p className="eyebrow">02 · WORKSPACE</p>
              <h1 id="projects-title">プロジェクト</h1>
              <p>実データは使いません。全部モックの要約です。</p>
            </div>
          </div>
          <StageStrip current="PROVISION" />
          <DemoBanner />
          {hydrated && ready ? (
            <>
              <article className="project-summary">
                <strong>{MOCK_REPO.fullName}</strong>
                <small>リポジトリ · Codex環境 · Pages · Convex（モック）</small>
                <p>{workspace?.codexEnvironmentId ?? MOCK_REPO.envId}</p>
                <p>{workspace?.cloudflarePagesUrl ?? MOCK_REPO.pagesUrl}</p>
                <p>
                  {workspace?.convexUrl ??
                    `https://${MOCK_REPO.project}.convex.cloud`}
                </p>
              </article>
              <ServiceCanvas />
              <ActivityTimeline />
              <Button onClick={() => router.push("/editor")} variant="primary">
                エディタを開く
              </Button>
            </>
          ) : (
            <p>先に4つのデモ接続をすると、ここに作業場が出ます。</p>
          )}
          <Button
            className="projects-back"
            icon={ArrowLeftIcon}
            onClick={() => router.push("/")}
            variant="ghost"
          >
            接続を管理
          </Button>
        </section>
      </main>
      <KonstaApp
        className={`mobile-experience ${connectFontVariables}`}
        dark
        safeAreas
        theme="ios"
      >
        <KonstaPage className="mobile-page mobile-connect-page">
          <div className="mobile-scroll-content">
            <section
              className="mobile-title-block"
              aria-labelledby="mobile-projects"
            >
              <p>02 · WORKSPACE</p>
              <h1 id="mobile-projects">プロジェクト</h1>
              <span>モックの要約だけです。</span>
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
              <p>先に4つのデモ接続をしてください。</p>
            )}
          </div>
          <div className="mobile-bottom-dock">
            <KonstaButton
              className="mobile-primary-action"
              onClick={() => router.push(ready ? "/editor" : "/")}
              rounded
            >
              {ready ? "エディタを開く" : "接続へ"}
            </KonstaButton>
          </div>
        </KonstaPage>
      </KonstaApp>
    </>
  );
};
