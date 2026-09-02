"use client";

import { Button, Flow, LayerCard } from "@cloudflare/kumo";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BellSimpleIcon,
  ChatCircleDotsIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  ClockIcon,
  CodeIcon,
  DotsThreeIcon,
  FileTsIcon,
  FolderIcon,
  GitDiffIcon,
  MicrophoneIcon,
  PaperPlaneTiltIcon,
  PlusIcon,
  StackIcon,
  StopIcon,
  TerminalWindowIcon,
} from "@phosphor-icons/react";
import {
  App as KonstaApp,
  Button as KonstaButton,
  Card as KonstaCard,
  Glass as KonstaGlass,
  List as KonstaList,
  ListItem as KonstaListItem,
  Page as KonstaPage,
  Progressbar as KonstaProgressbar,
} from "konsta/react";
import Image from "next/image";
import { useState } from "react";

type ConnectionStatus = "connected" | "connecting" | "disconnected";
type ServiceId = "chatgpt" | "cloudflare" | "convex" | "github";
type SessionStatus = "done" | "review" | "running" | "attention";
type Screen = "login" | "connect" | "projects" | "editor";

const SERVICES = [
  {
    id: "chatgpt",
    identity: "michito@gmail.com",
    label: "ChatGPT",
    logo: "/brands/chatgpt.png",
  },
  {
    id: "github",
    identity: "@MichitoSugawara",
    label: "GitHub",
    logo: "/brands/github.ico",
  },
  {
    id: "cloudflare",
    identity: "michito.cloudflare",
    label: "Cloudflare",
    logo: "/brands/cloudflare.ico",
  },
  {
    id: "convex",
    identity: "team: gawa",
    label: "Convex",
    logo: "/brands/convex.ico",
  },
] as const;

const PROJECTS = [
  {
    accent: "orange",
    description: "今日 · 5分前に更新",
    id: "adhd-stack",
    name: "adhd-stack",
    sessions: [
      { id: "s1", label: "モバイルUIを整える", status: "running" },
      { id: "s2", label: "ログイン導線", status: "review" },
      { id: "s3", label: "接続状態の確認", status: "attention" },
      { id: "s4", label: "Turborepo setup", status: "done" },
    ],
  },
  {
    accent: "blue",
    description: "今日 · 18分前に更新",
    id: "micronix-mas250",
    name: "micronix-mas250",
    sessions: [
      { id: "s5", label: "計測フローを確認", status: "running" },
      { id: "s6", label: "Analyzer timing", status: "done" },
      { id: "s7", label: "CSV export", status: "done" },
    ],
  },
  {
    accent: "violet",
    description: "昨日 · 16:42に更新",
    id: "withx-replace",
    name: "withx-replace",
    sessions: [
      { id: "s8", label: "Gate 0 review", status: "attention" },
      { id: "s9", label: "画面棚卸し", status: "review" },
      { id: "s10", label: "要件差分を整理", status: "review" },
    ],
  },
] as const;

const INITIAL_CONNECTIONS = {
  chatgpt: "connected",
  cloudflare: "connected",
  convex: "disconnected",
  github: "connected",
} satisfies Record<ServiceId, ConnectionStatus>;

const STATUS_LABELS = {
  connected: "接続済み",
  connecting: "接続中",
  disconnected: "未接続",
} satisfies Record<ConnectionStatus, string>;

const SESSION_LABELS = {
  attention: "要確認",
  done: "完了",
  review: "レビュー",
  running: "進行中",
} satisfies Record<SessionStatus, string>;

type Project = (typeof PROJECTS)[number];

const sessionCounts = {
  attention: 2,
  done: 3,
  review: 3,
  running: 2,
} satisfies Record<SessionStatus, number>;

interface LoginMockProperties {
  onLogin: () => void;
}

const LoginMock = ({ onLogin }: LoginMockProperties) => (
  <>
    <main className="login-shell desktop-experience">
      <section className="login-card" aria-labelledby="login-title">
        <span className="login-brand-mark" aria-hidden="true">
          <StackIcon size={25} weight="bold" />
        </span>
        <p className="eyebrow">ADHD STACK</p>
        <h1 id="login-title">おかえりなさい</h1>
        <p className="login-description">
          ひとつの場所で、プロジェクトとAIセッションを続けられます。
        </p>
        <Button className="google-login-button" onClick={onLogin} size="lg">
          <Image alt="" height={20} src="/brands/google.svg" width={20} />
          Googleで続ける
        </Button>
        <small>この画面はフロントエンドモックです</small>
      </section>
    </main>

    <KonstaApp className="mobile-experience" dark={false} safeAreas theme="ios">
      <KonstaPage className="mobile-page mobile-login-page">
        <div className="mobile-login-orb mobile-login-orb--one" />
        <div className="mobile-login-orb mobile-login-orb--two" />
        <section
          className="mobile-login-content"
          aria-labelledby="mobile-login-title"
        >
          <span className="mobile-login-mark" aria-hidden="true">
            <StackIcon size={30} weight="bold" />
          </span>
          <div>
            <p>ADHD STACK</p>
            <h1 id="mobile-login-title">頭の中は、空のままで。</h1>
            <span>開発の続きは、ここに全部あります。</span>
          </div>
          <KonstaGlass className="mobile-login-glass">
            <KonstaButton
              className="mobile-google-button"
              large
              onClick={onLogin}
              rounded
            >
              <Image alt="" height={20} src="/brands/google.svg" width={20} />
              Googleで続ける
            </KonstaButton>
            <small>フロントエンドモック · 認証情報は保存されません</small>
          </KonstaGlass>
        </section>
      </KonstaPage>
    </KonstaApp>
  </>
);

interface MobileConnectMockProperties {
  allConnected: boolean;
  connections: Record<ServiceId, ConnectionStatus>;
  onBack: () => void;
  onConnect: (serviceId: ServiceId) => void;
  onDisconnect: (serviceId: ServiceId) => void;
  onOpenProjects: () => void;
}

const MobileConnectMock = ({
  allConnected,
  connections,
  onBack,
  onConnect,
  onDisconnect,
  onOpenProjects,
}: MobileConnectMockProperties) => {
  const connectedCount = Object.values(connections).filter(
    (status) => status === "connected"
  ).length;

  return (
    <KonstaApp className="mobile-experience" dark={false} safeAreas theme="ios">
      <KonstaPage className="mobile-page mobile-connect-page">
        <div className="mobile-connect-orb" />
        <div className="mobile-scroll-content">
          <header className="mobile-app-header">
            <KonstaButton
              aria-label="ログインへ戻る"
              className="mobile-circle-button"
              clear
              onClick={onBack}
              rounded
            >
              <ArrowLeftIcon size={24} weight="bold" />
            </KonstaButton>
            <span className="mobile-account-pill">MS</span>
          </header>

          <section
            className="mobile-title-block"
            aria-labelledby="mobile-title"
          >
            <p>STEP 1 OF 1</p>
            <h1 id="mobile-title">接続</h1>
            <span>必要なサービスをつなげば、すぐ始められます。</span>
          </section>

          <div className="mobile-node-grid">
            {SERVICES.map((service) => {
              const status = connections[service.id];
              const isConnected = status === "connected";

              return (
                <button
                  aria-label={`${service.label}: ${STATUS_LABELS[status]}. ${isConnected ? "切断する" : "接続する"}`}
                  className="mobile-card-button"
                  disabled={status === "connecting"}
                  key={service.id}
                  onClick={() =>
                    isConnected
                      ? onDisconnect(service.id)
                      : onConnect(service.id)
                  }
                  type="button"
                >
                  <KonstaGlass
                    className={`mobile-service-card mobile-service-card--${status}`}
                  >
                    <span className="mobile-service-icon" aria-hidden="true">
                      <Image
                        alt=""
                        className="service-logo-image"
                        height={28}
                        src={service.logo}
                        width={28}
                      />
                    </span>
                    <span className="mobile-service-name">{service.label}</span>
                    <span className={`mobile-status mobile-status--${status}`}>
                      {status === "connecting"
                        ? "接続しています…"
                        : STATUS_LABELS[status]}
                    </span>
                    <span className="mobile-service-identity">
                      {isConnected ? service.identity : "タップして接続"}
                    </span>
                  </KonstaGlass>
                </button>
              );
            })}
          </div>

          <section className="mobile-progress" aria-label="接続の進捗">
            <div>
              <span>準備の進捗</span>
              <strong>{connectedCount}/4</strong>
            </div>
            <KonstaProgressbar progress={connectedCount / SERVICES.length} />
          </section>
        </div>

        <div className="mobile-bottom-dock">
          <KonstaGlass className="mobile-glass-bar">
            <div>
              <strong>
                {allConnected ? "準備完了" : `あと${4 - connectedCount}つ`}
              </strong>
              <span>
                {allConnected
                  ? "プロジェクトを開けます"
                  : "カードをタップして接続"}
              </span>
            </div>
            <KonstaButton
              aria-label="プロジェクト一覧へ"
              className="mobile-primary-action"
              disabled={!allConnected}
              onClick={onOpenProjects}
              rounded
            >
              <ArrowRightIcon size={19} weight="bold" />
            </KonstaButton>
          </KonstaGlass>
        </div>
      </KonstaPage>
    </KonstaApp>
  );
};

interface ProjectsMockProperties {
  onBack: () => void;
  onOpenProject: (project: Project) => void;
}

const StatusIcon = ({ status }: { status: SessionStatus }) => {
  if (status === "attention") {
    return <BellSimpleIcon size={17} weight="fill" />;
  }
  if (status === "review") {
    return <ClockIcon size={17} weight="bold" />;
  }
  if (status === "done") {
    return <CheckCircleIcon size={17} weight="fill" />;
  }
  return <CircleNotchIcon size={17} weight="bold" />;
};

const ProjectsMock = ({ onBack, onOpenProject }: ProjectsMockProperties) => (
  <>
    <main className="projects-shell desktop-experience">
      <header className="product-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <StackIcon size={19} weight="bold" />
          </span>
          <span>ADHD Stack</span>
        </div>
        <div className="desktop-account">
          <span>michito@gmail.com</span>
          <b>MS</b>
        </div>
      </header>

      <section className="projects-page" aria-labelledby="projects-title">
        <div className="projects-heading">
          <div>
            <p className="eyebrow">WORKSPACES</p>
            <h1 id="projects-title">プロジェクト</h1>
            <p>進行中のセッションから、すぐ続きを始められます。</p>
          </div>
          <Button icon={PlusIcon} variant="primary">
            新しいプロジェクト
          </Button>
        </div>

        <div className="desktop-status-grid">
          {(["running", "attention", "review", "done"] as const).map(
            (status) => (
              <LayerCard
                className={`desktop-status-card status-tone--${status}`}
                key={status}
              >
                <StatusIcon status={status} />
                <span>{SESSION_LABELS[status]}</span>
                <strong>{sessionCounts[status]}</strong>
              </LayerCard>
            )
          )}
        </div>

        <div className="desktop-project-list">
          {PROJECTS.map((project) => (
            <button
              className="desktop-project-row"
              key={project.id}
              onClick={() => onOpenProject(project)}
              type="button"
            >
              <span
                className={`project-folder project-folder--${project.accent}`}
              >
                <FolderIcon size={22} weight="duotone" />
              </span>
              <span className="desktop-project-copy">
                <strong>{project.name}</strong>
                <small>{project.description}</small>
              </span>
              <span className="desktop-session-chips">
                {project.sessions.map((session) => (
                  <i
                    className={`session-chip session-chip--${session.status}`}
                    key={session.id}
                  >
                    {SESSION_LABELS[session.status]}
                  </i>
                ))}
              </span>
              <span className="project-session-count">
                {project.sessions.length} sessions
              </span>
              <ArrowRightIcon size={18} />
            </button>
          ))}
        </div>

        <Button
          className="projects-back"
          icon={ArrowLeftIcon}
          onClick={onBack}
          variant="ghost"
        >
          接続を管理
        </Button>
      </section>
    </main>

    <KonstaApp className="mobile-experience" dark={false} safeAreas theme="ios">
      <KonstaPage className="mobile-page mobile-projects-page">
        <div className="mobile-project-scroll">
          <header className="mobile-app-header">
            <KonstaButton
              aria-label="接続へ戻る"
              className="mobile-circle-button"
              clear
              onClick={onBack}
              rounded
            >
              <ArrowLeftIcon size={24} weight="bold" />
            </KonstaButton>
            <div className="mobile-project-actions">
              <KonstaButton
                aria-label="新しいプロジェクト"
                className="mobile-circle-button"
                clear
                rounded
              >
                <FolderIcon size={23} weight="duotone" />
                <PlusIcon
                  className="mobile-folder-plus"
                  size={13}
                  weight="bold"
                />
              </KonstaButton>
              <span className="mobile-account-pill">MS</span>
            </div>
          </header>

          <section className="mobile-project-title">
            <p>WORKSPACES</p>
            <h1>プロジェクト</h1>
            <span>動いているものだけ、上に出しています。</span>
          </section>

          <div className="mobile-status-grid">
            {(["running", "attention", "review", "done"] as const).map(
              (status) => (
                <KonstaCard
                  className={`mobile-summary-card status-tone--${status}`}
                  key={status}
                  outlineIos
                >
                  <StatusIcon status={status} />
                  <span>{SESSION_LABELS[status]}</span>
                  <strong>{sessionCounts[status]}</strong>
                </KonstaCard>
              )
            )}
          </div>

          <h2 className="mobile-list-heading">最近のプロジェクト</h2>
          <KonstaList className="mobile-project-list" insetIos strongIos>
            {PROJECTS.map((project) => {
              const active = project.sessions.filter(
                (session) => session.status !== "done"
              );
              return (
                <KonstaListItem
                  after={`${project.sessions.length}`}
                  chevron
                  key={project.id}
                  link
                  linkComponent="button"
                  linkProps={{
                    "aria-label": `${project.name}、${project.sessions.length}セッション`,
                    onClick: () => onOpenProject(project),
                    type: "button",
                  }}
                  media={
                    <span
                      className={`project-folder project-folder--${project.accent}`}
                    >
                      <FolderIcon size={22} weight="duotone" />
                    </span>
                  }
                  subtitle={
                    <span className="mobile-project-subtitle">
                      {active.slice(0, 2).map((session) => (
                        <i
                          className={`session-dot session-dot--${session.status}`}
                          key={session.id}
                        >
                          {SESSION_LABELS[session.status]}
                        </i>
                      ))}
                    </span>
                  }
                  title={project.name}
                />
              );
            })}
          </KonstaList>
        </div>

        <div className="mobile-project-dock">
          <KonstaGlass className="mobile-project-glass">
            <PlusIcon size={22} />
            <span>新しいプロジェクト</span>
            <MicrophoneIcon size={20} weight="fill" />
          </KonstaGlass>
        </div>
      </KonstaPage>
    </KonstaApp>
  </>
);

interface MobileEditorMockProperties {
  onBack: () => void;
  project: Project;
}

const MobileEditorMock = ({ onBack, project }: MobileEditorMockProperties) => (
  <KonstaApp className="mobile-experience" dark={false} safeAreas theme="ios">
    <KonstaPage className="mobile-page mobile-editor-page">
      <header className="mobile-editor-nav">
        <KonstaButton
          aria-label="プロジェクトへ戻る"
          className="mobile-circle-button"
          clear
          onClick={onBack}
          rounded
        >
          <ArrowLeftIcon size={25} weight="bold" />
        </KonstaButton>
        <strong>{project.name}</strong>
        <KonstaButton
          aria-label="その他"
          className="mobile-circle-button"
          clear
          rounded
        >
          <DotsThreeIcon size={26} weight="bold" />
        </KonstaButton>
      </header>
      <div className="mobile-conversation">
        <div className="mobile-session-context">
          <i />
          <span>{project.sessions[0].label}</span>
          <b>{SESSION_LABELS[project.sessions[0].status]}</b>
        </div>
        <div className="mobile-user-message">
          シンプルなタスク管理アプリを作って
        </div>
        <p className="mobile-tool-summary">Explored 5 files, 1 search</p>
        <p className="mobile-assistant-copy">
          画面構成を確認しました。まず小さく動く画面を作り、確認できる状態にします。
        </p>
        <p className="mobile-tool-summary">Changed 4 files</p>
        <KonstaCard
          className="mobile-changes-card"
          header={
            <span>
              Changes <i>4</i>
            </span>
          }
          headerDivider
          outlineIos
        >
          <div className="mobile-change-row">
            <FileTsIcon size={22} />
            <span>page.tsx</span>
            <em>+48 −2</em>
          </div>
          <div className="mobile-change-row">
            <FileTsIcon size={22} />
            <span>frontend-mock.tsx</span>
            <em>+96 −8</em>
          </div>
          <div className="mobile-change-row">
            <GitDiffIcon size={22} />
            <span>globals.css</span>
            <em>+74 −12</em>
          </div>
          <div className="mobile-change-row">
            <DotsThreeIcon size={22} />
            <span>1 more</span>
          </div>
        </KonstaCard>
      </div>
      <div className="mobile-composer-dock">
        <KonstaButton className="mobile-review-button" outlineIos rounded>
          Review <span>+218 −22</span>
        </KonstaButton>
        <KonstaGlass className="mobile-composer-glass">
          <KonstaButton
            aria-label="追加"
            className="mobile-composer-icon"
            clear
            rounded
          >
            <PlusIcon size={23} />
          </KonstaButton>
          <span>Follow up…</span>
          <KonstaButton
            aria-label="音声入力"
            className="mobile-composer-icon"
            clear
            rounded
          >
            <MicrophoneIcon size={21} weight="fill" />
          </KonstaButton>
          <KonstaButton
            aria-label="停止"
            className="mobile-stop-button"
            rounded
          >
            <StopIcon size={16} weight="fill" />
          </KonstaButton>
        </KonstaGlass>
      </div>
    </KonstaPage>
  </KonstaApp>
);

interface EditorMockProperties {
  onBack: () => void;
  project: Project;
}

const EditorMock = ({ onBack, project }: EditorMockProperties) => (
  <>
    <main className="desktop-experience editor-shell">
      <aside className="editor-sidebar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <StackIcon size={19} weight="bold" />
          </span>
          <span>ADHD Stack</span>
        </div>
        <nav aria-label="エディターツール">
          <button className="sidebar-item is-active" type="button">
            <ChatCircleDotsIcon size={18} />
            チャット
          </button>
          <button className="sidebar-item" type="button">
            <CodeIcon size={18} />
            ファイル
          </button>
          <button className="sidebar-item" type="button">
            <TerminalWindowIcon size={18} />
            コマンド
          </button>
        </nav>
        <Button
          className="back-button"
          icon={ArrowLeftIcon}
          onClick={onBack}
          size="sm"
          variant="ghost"
        >
          プロジェクトへ戻る
        </Button>
      </aside>
      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="editor-label">RUNNING SESSION</p>
            <strong>
              {project.name} / {project.sessions[0].label}
            </strong>
          </div>
          <Button disabled size="sm" variant="primary">
            公開する
          </Button>
        </header>
        <div className="chat-empty">
          <span className="empty-icon" aria-hidden="true">
            <ChatCircleDotsIcon size={28} weight="duotone" />
          </span>
          <h1>何を作りますか？</h1>
          <p>話しかけるだけで、コードが書き始められます。</p>
        </div>
        <form className="composer" onSubmit={(event) => event.preventDefault()}>
          <label className="sr-only" htmlFor="prompt">
            作りたいものを入力
          </label>
          <textarea
            id="prompt"
            name="prompt"
            placeholder="作りたいものを話してください…"
            rows={3}
          />
          <Button
            aria-label="送信"
            disabled
            icon={PaperPlaneTiltIcon}
            shape="circle"
            title="送信"
            variant="primary"
          />
        </form>
      </section>
    </main>
    <MobileEditorMock onBack={onBack} project={project} />
  </>
);

export const FrontendMock = () => {
  const [connections, setConnections] =
    useState<Record<ServiceId, ConnectionStatus>>(INITIAL_CONNECTIONS);
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedProject, setSelectedProject] = useState<Project>(PROJECTS[0]);
  const allConnected = Object.values(connections).every(
    (status) => status === "connected"
  );

  const connect = (serviceId: ServiceId) => {
    setConnections((current) => ({ ...current, [serviceId]: "connecting" }));
    window.setTimeout(
      () =>
        setConnections((current) => ({ ...current, [serviceId]: "connected" })),
      700
    );
  };
  const disconnect = (serviceId: ServiceId) =>
    setConnections((current) => ({ ...current, [serviceId]: "disconnected" }));
  const openProject = (project: Project) => {
    setSelectedProject(project);
    setScreen("editor");
  };

  if (screen === "login") {
    return <LoginMock onLogin={() => setScreen("connect")} />;
  }
  if (screen === "projects") {
    return (
      <ProjectsMock
        onBack={() => setScreen("connect")}
        onOpenProject={openProject}
      />
    );
  }
  if (screen === "editor") {
    return (
      <EditorMock
        onBack={() => setScreen("projects")}
        project={selectedProject}
      />
    );
  }

  const connectedCount = Object.values(connections).filter(
    (status) => status === "connected"
  ).length;

  return (
    <>
      <main className="app-shell desktop-experience">
        <header className="product-header">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <StackIcon size={19} weight="bold" />
            </span>
            <span>ADHD Stack</span>
          </div>
          <div className="desktop-account">
            <span>michito@gmail.com</span>
            <b>MS</b>
          </div>
        </header>
        <section className="connection-page" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">CONNECT ONCE. BUILD ANYTHING.</p>
            <h1 id="hero-title">何も考えずに、始める。</h1>
            <p>つなぐだけで、開発から公開まで。</p>
          </div>
          <div className="flow-shell">
            <div className="flow-heading">
              <div>
                <p className="flow-title">接続</p>
                <p className="flow-description">
                  4つそろうと、プロジェクトを開けます。
                </p>
              </div>
              <span className="connection-count">
                {connectedCount}/4 接続済み
              </span>
            </div>
            <Flow
              align="center"
              className="connection-flow"
              orientation="vertical"
              padding={{ x: 28, y: 38 }}
            >
              <Flow.Parallel>
                {SERVICES.map((service) => {
                  const status = connections[service.id];
                  return (
                    <Flow.Node
                      disabled={status === "disconnected"}
                      id={service.id}
                      key={service.id}
                      render={
                        <div className={`service-node service-node--${status}`}>
                          <div className="service-main">
                            <span className="service-icon" aria-hidden="true">
                              <Image
                                alt=""
                                className="service-logo-image"
                                height={26}
                                src={service.logo}
                                width={26}
                              />
                            </span>
                            <span>
                              <strong>{service.label}</strong>
                              <span className="service-identity">
                                {status === "connected"
                                  ? service.identity
                                  : "アカウント未選択"}
                              </span>
                              <span className={`status status--${status}`}>
                                <i aria-hidden="true" />
                                {STATUS_LABELS[status]}
                              </span>
                            </span>
                          </div>
                          {status === "connected" ? (
                            <Button
                              aria-label={`${service.label}を切断`}
                              className="node-action node-action--connected"
                              onClick={() => disconnect(service.id)}
                              shape="circle"
                              size="sm"
                              title={`${service.label}を切断`}
                              variant="ghost"
                            >
                              <CheckIcon size={14} weight="bold" />
                            </Button>
                          ) : (
                            <Button
                              className="node-action"
                              loading={status === "connecting"}
                              onClick={() => connect(service.id)}
                              size="sm"
                              variant="secondary"
                            >
                              接続する
                            </Button>
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </Flow.Parallel>
              <Flow.Node
                disabled={!allConnected}
                id="projects"
                render={
                  <li
                    className={`editor-node ${allConnected ? "is-ready" : ""}`}
                  >
                    <div>
                      <span className="editor-label">NEXT</span>
                      <strong>プロジェクト</strong>
                    </div>
                    <Button
                      aria-label="プロジェクト一覧へ"
                      disabled={!allConnected}
                      icon={ArrowRightIcon}
                      onClick={() => setScreen("projects")}
                      shape="circle"
                      title="プロジェクト一覧へ"
                      variant="primary"
                    />
                  </li>
                }
              />
            </Flow>
          </div>
          <Button
            className="connection-back"
            icon={ArrowLeftIcon}
            onClick={() => setScreen("login")}
            variant="ghost"
          >
            ログアウト
          </Button>
        </section>
      </main>
      <MobileConnectMock
        allConnected={allConnected}
        connections={connections}
        onBack={() => setScreen("login")}
        onConnect={connect}
        onDisconnect={disconnect}
        onOpenProjects={() => setScreen("projects")}
      />
    </>
  );
};
