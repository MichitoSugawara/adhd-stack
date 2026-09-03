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
import { SERVICES } from "../lib/services";
import { DemoBanner } from "./demo-banner";

const NODES = [
  ...SERVICES.map((service) => ({
    id: service.id,
    label: service.label,
  })),
  { id: "repo", label: "Repo" },
  { id: "env", label: "Codex env" },
  { id: "pages", label: "Pages" },
  { id: "convex-app", label: "Convex" },
] as const;

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
              <p className="eyebrow">MOCK WORKSPACE</p>
              <h1 id="projects-title">プロジェクト</h1>
              <p>実データは使いません。全部モックの要約です。</p>
            </div>
          </div>
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
              <div className="service-graph" aria-label="サービスの関係">
                {NODES.map((node, index) => (
                  <div className="graph-row" key={node.id}>
                    <span className="graph-node">{node.label}</span>
                    {index < NODES.length - 1 ? (
                      <span className="graph-line" aria-hidden="true" />
                    ) : null}
                  </div>
                ))}
              </div>
              <ol className="activity-list">
                <li>デモ接続をそろえた</li>
                <li>モックの {MOCK_REPO.fullName} を用意した</li>
                <li>Codex 環境 {MOCK_REPO.envId} を表示した</li>
              </ol>
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
              <p>DEMO · PROJECTS</p>
              <h1 id="mobile-projects">プロジェクト</h1>
              <span>モックの要約だけです。</span>
            </section>
            <DemoBanner />
            {hydrated && ready ? (
              <article className="project-summary">
                <strong>{MOCK_REPO.fullName}</strong>
                <small>Repo / Env / Pages / Convex（モック）</small>
              </article>
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
