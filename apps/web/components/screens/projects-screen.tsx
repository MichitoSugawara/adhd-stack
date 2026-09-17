"use client";

import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { StatusChip } from "@/components/screens/status-chip";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useWorkspaceList } from "@/lib/coding-port";
import { hasConvexUrl } from "@/lib/env";
import { listAppStatus } from "@/lib/env-labels";
import { hostOf, publicHttpUrl } from "@/lib/public-url";
import { relativeFrom } from "@/lib/relative-time";
import { useShell } from "@/lib/shell-state";

import "./workspace-home.css";

type ProjectFilter = "all" | "published" | "draft" | "attention";
type ProjectView = "grid" | "list";

interface Project {
  href: string;
  id: string;
  name: string;
  pages: string | null;
  slug: string;
  status: ReturnType<typeof listAppStatus>;
  updatedAt: number;
}

const FILTERS: { label: string; value: ProjectFilter }[] = [
  { label: "すべて", value: "all" },
  { label: "制作中", value: "draft" },
  { label: "公開済み", value: "published" },
  { label: "要確認", value: "attention" },
];

let clockTime = Date.now();
const clockSnapshot = (): number => clockTime;
const serverClockSnapshot = (): number => 0;
const subscribeClock = (listener: () => void): (() => void) => {
  clockTime = Date.now();
  const timer = setInterval(() => {
    clockTime = Date.now();
    listener();
  }, 60_000);
  return () => {
    clearInterval(timer);
  };
};

const projectAddress = (app: Project, offline: boolean): string => {
  if (offline) {
    return "このブラウザの UI プレビュー";
  }
  return app.pages ? hostOf(app.pages) : "まだ公開されていません";
};

const ArrowIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="18"
    viewBox="0 0 24 24"
    width="18"
  >
    <path
      d="M5 12h14m-6-6 6 6-6 6"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="17"
    viewBox="0 0 24 24"
    width="17"
  >
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.7"
    />
  </svg>
);

const ProjectArtwork = ({ name, seed }: { name: string; seed: string }) => {
  const variant =
    [...seed].reduce(
      (sum, character) => sum + (character.codePointAt(0) ?? 0),
      0
    ) % 4;
  return (
    <div
      aria-hidden="true"
      className={`workspace-art workspace-art-${String(variant)}`}
    >
      <svg className="workspace-art-lines" fill="none" viewBox="0 0 400 200">
        {variant % 2 === 0 ? (
          <>
            <circle cx="315" cy="32" r="108" />
            <circle cx="315" cy="32" r="135" />
            <circle cx="315" cy="32" r="162" />
            <path d="M-30 180 170-20M-10 200 190 0M10 220 210 20" />
          </>
        ) : (
          <>
            <path d="m270-50 170 100-170 100-170-100Zm0 30L440 80 270 180 100 80Zm0 30L440 110 270 210 100 110Z" />
            <circle cx="30" cy="190" r="75" />
            <circle cx="30" cy="190" r="100" />
          </>
        )}
      </svg>
      <span className="workspace-art-monogram">{[...name][0] || "A"}</span>
      <span className="workspace-art-label">A SPACE FOR YOUR IDEAS</span>
    </div>
  );
};

const ProjectCard = ({
  app,
  now,
  offline,
}: {
  app: Project;
  now: number;
  offline: boolean;
}) => (
  <li className="workspace-project">
    <Link
      aria-label={`${app.name}を開く`}
      className="workspace-project-link"
      href={app.href}
    >
      <ProjectArtwork name={app.name} seed={app.id} />
      <div className="workspace-project-body">
        <div className="workspace-project-name-row">
          <h3>{app.name}</h3>
          <span className="workspace-project-arrow">
            <ArrowIcon />
          </span>
        </div>
        <p className="workspace-project-address">
          {projectAddress(app, offline)}
        </p>
        <div className="workspace-project-meta">
          <StatusChip tone={offline ? "idle" : app.status.tone}>
            {offline ? "UI プレビュー" : app.status.label}
          </StatusChip>
          <span>{now ? `${relativeFrom(app.updatedAt, now)}に更新` : "—"}</span>
        </div>
      </div>
    </Link>
  </li>
);

const EmptyWorkspace = () => (
  <section className="workspace-empty">
    <div aria-hidden="true" className="workspace-empty-art">
      <span className="workspace-empty-sheet workspace-empty-sheet-back">
        <span />
      </span>
      <span className="workspace-empty-sheet workspace-empty-sheet-front">
        <svg fill="none" viewBox="0 0 64 64">
          <path
            d="M32 10v44M10 32h44"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <circle cx="32" cy="32" r="25" stroke="currentColor" />
        </svg>
      </span>
      <span className="workspace-empty-dot" />
    </div>
    <p className="ui-eyebrow">YOUR NEXT IDEA STARTS HERE</p>
    <h2>その「ほしい」を、つくろう。</h2>
    <p>
      毎日使いたい小さな道具も、温めていたアイデアも。
      <br />
      会話をしながら、自分だけのアプリに。
    </p>
    <Link className="ui-button ui-button-primary" data-new-app href="/new">
      <PlusIcon />
      最初のアプリをつくる
    </Link>
    <div className="workspace-empty-steps">
      <span>
        <i>01</i> アイデアを決める
      </span>
      <span>
        <i>02</i> AI と形にする
      </span>
      <span>
        <i>03</i> 公開して使う
      </span>
    </div>
  </section>
);

const WorkspaceContent = ({
  apps,
  offline = false,
}: {
  apps: Project[] | undefined;
  offline?: boolean;
}) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [view, setView] = useState<ProjectView>("grid");
  const now = useSyncExternalStore(
    subscribeClock,
    clockSnapshot,
    serverClockSnapshot
  );
  const sortedApps = (apps ?? []).toSorted(
    (left, right) => right.updatedAt - left.updatedAt
  );
  const query = search.trim().toLocaleLowerCase();
  const filteredApps = sortedApps.filter((app) => {
    if (
      query &&
      !`${app.name} ${app.slug}`.toLocaleLowerCase().includes(query)
    ) {
      return false;
    }
    if (filter === "attention") {
      return !offline && app.status.tone === "fail";
    }
    if (filter === "published") {
      return !offline && app.pages !== null && app.status.tone === "ok";
    }
    if (filter === "draft") {
      return (
        offline ||
        (app.status.tone !== "fail" &&
          (app.pages === null || app.status.tone !== "ok"))
      );
    }
    return true;
  });
  const [recent] = sortedApps;

  return (
    <div className="workspace-home">
      <header className="workspace-heading">
        <div>
          <p className="ui-eyebrow">YOUR WORKSPACE</p>
          <h1>
            あなたのアプリ<span className="workspace-heading-dot">.</span>
          </h1>
          <p className="workspace-description">
            アイデアを育てる、あなたの作業場所。
          </p>
        </div>
        <Link className="ui-button ui-button-primary" data-new-app href="/new">
          <PlusIcon />
          新しいアプリ
        </Link>
      </header>

      {offline ? (
        <p className="workspace-preview-notice">
          <span>UI プレビュー</span>{" "}
          このブラウザだけの表示です。アプリの作成・公開は行われません。
        </p>
      ) : null}

      {recent ? (
        <section aria-label="最近のアプリ" className="workspace-resume">
          <div aria-hidden="true" className="workspace-resume-icon">
            {[...recent.name][0] || "A"}
          </div>
          <div className="workspace-resume-copy">
            <p>続きから、はじめよう</p>
            <h2>{recent.name}</h2>
            <span>
              最終更新 {now ? relativeFrom(recent.updatedAt, now) : "—"}
            </span>
          </div>
          <Link className="ui-button" href={recent.href}>
            続きを開く
            <ArrowIcon />
          </Link>
        </section>
      ) : null}

      {apps === undefined ? (
        <div
          aria-busy="true"
          aria-label="アプリを読み込み中"
          className="workspace-loading"
          role="status"
        >
          <span className="workspace-loading-label">
            アプリを読み込んでいます…
          </span>
          {[0, 1, 2].map((index) => (
            <div
              aria-hidden="true"
              className="workspace-loading-card"
              key={index}
            >
              <div />
              <span />
              <span />
            </div>
          ))}
        </div>
      ) : null}
      {apps?.length === 0 ? <EmptyWorkspace /> : null}
      {apps !== undefined && apps.length > 0 ? (
        <section aria-label="アプリ一覧" className="workspace-library">
          <div className="workspace-library-heading">
            <h2>
              すべてのアプリ <span>{String(apps.length)}</span>
            </h2>
            <span>最近更新した順</span>
          </div>
          <div className="workspace-toolbar">
            <div
              aria-label="アプリの状態"
              className="workspace-filters"
              role="group"
            >
              {FILTERS.map((item) => (
                <button
                  aria-pressed={filter === item.value}
                  className={filter === item.value ? "is-active" : ""}
                  key={item.value}
                  onClick={() => {
                    setFilter(item.value);
                  }}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="workspace-tools">
              <label className="workspace-search">
                <svg
                  aria-hidden="true"
                  fill="none"
                  height="17"
                  viewBox="0 0 24 24"
                  width="17"
                >
                  <circle
                    cx="10.5"
                    cy="10.5"
                    r="6.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="m16 16 4.5 4.5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="1.6"
                  />
                </svg>
                <input
                  aria-label="アプリを検索"
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  placeholder="アプリを検索…"
                  type="search"
                  value={search}
                />
              </label>
              <div
                aria-label="表示形式"
                className="workspace-view-toggle"
                role="group"
              >
                <button
                  aria-label="グリッド表示"
                  aria-pressed={view === "grid"}
                  className={view === "grid" ? "is-active" : ""}
                  onClick={() => {
                    setView("grid");
                  }}
                  title="グリッド表示"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="17"
                    viewBox="0 0 24 24"
                    width="17"
                  >
                    <path
                      d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z"
                      stroke="currentColor"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
                <button
                  aria-label="リスト表示"
                  aria-pressed={view === "list"}
                  className={view === "list" ? "is-active" : ""}
                  onClick={() => {
                    setView("list");
                  }}
                  title="リスト表示"
                  type="button"
                >
                  <svg
                    aria-hidden="true"
                    fill="none"
                    height="17"
                    viewBox="0 0 24 24"
                    width="17"
                  >
                    <path
                      d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <p aria-live="polite" className="sr-only">
            {String(filteredApps.length)} 件のアプリ
          </p>
          {filteredApps.length > 0 ? (
            <ul className={`workspace-projects workspace-projects-${view}`}>
              {filteredApps.map((app) => (
                <ProjectCard
                  app={app}
                  key={app.id}
                  now={now}
                  offline={offline}
                />
              ))}
              {view === "grid" && !query && filter === "all" ? (
                <li className="workspace-create-card">
                  <Link href="/new">
                    <span>
                      <PlusIcon />
                    </span>
                    <strong>次のアイデアをかたちに</strong>
                    <p>新しいアプリをつくる</p>
                  </Link>
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="workspace-no-results">
              <h3>アプリが見つかりませんでした</h3>
              <p>検索する言葉や、状態の絞り込みを変えてみてください。</p>
              <button
                className="ui-button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
                type="button"
              >
                絞り込みをクリア
              </button>
            </div>
          )}
        </section>
      ) : null}
      <footer className="workspace-footer">
        <span aria-hidden="true">✳</span> ひとつずつ、あなたのペースで。
      </footer>
    </div>
  );
};

const ProjectsLive = () => {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const apps = useWorkspaceList();
  if (!isLoading && !isAuthenticated) {
    return (
      <div className="workspace-home">
        <header className="workspace-heading">
          <div>
            <p className="ui-eyebrow">YOUR WORKSPACE</p>
            <h1>
              あなたのアプリ<span className="workspace-heading-dot">.</span>
            </h1>
          </div>
        </header>
        <section className="workspace-empty">
          <p className="ui-eyebrow">WELCOME BACK</p>
          <h2>アカウントをつないで、続きを。</h2>
          <p>保存したアプリを開くには、アカウントへの接続が必要です。</p>
          <Link className="ui-button ui-button-primary" href="/connect">
            アカウントを接続する
            <ArrowIcon />
          </Link>
        </section>
      </div>
    );
  }
  return (
    <WorkspaceContent
      apps={apps?.map((app) => {
        const pages = publicHttpUrl(app.cloudflarePagesUrl);
        return {
          href:
            app.provisionStatus === "ready"
              ? `/p/${app.slug}`
              : `/p/${app.slug}/creating`,
          id: app._id,
          name: app.name,
          pages,
          slug: app.slug,
          status: listAppStatus(
            pages,
            app.pagesDeployStatus,
            app.provisionStatus
          ),
          updatedAt: app.updatedAt,
        };
      })}
    />
  );
};

const ProjectsOffline = () => {
  const shell = useShell();
  return (
    <WorkspaceContent
      apps={shell.state.apps.map((app) => ({
        href:
          app.status === "creating" ? `/p/${app.id}/creating` : `/p/${app.id}`,
        id: app.id,
        name: app.name,
        pages: null,
        slug: app.id,
        status: { label: "UI プレビュー", tone: "idle" },
        updatedAt: app.createdAt,
      }))}
      offline
    />
  );
};

export const ProjectsScreen = () => (
  <ShellGate>
    <AppFrame>
      <main className="workspace-scroll">
        {hasConvexUrl() ? <ProjectsLive /> : <ProjectsOffline />}
      </main>
    </AppFrame>
  </ShellGate>
);
