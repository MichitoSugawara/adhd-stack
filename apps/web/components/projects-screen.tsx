"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import { previewTagClass } from "../lib/preview-ui";
import { MobileNav } from "./mobile-nav";
import { NeedSession } from "./need-session";
import { StackChrome } from "./stack-chrome";
import { Toast } from "./toast";

type Filter = "all" | "wait" | "work";

export const ProjectsScreen = () => {
  const app = useMockApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  if (app.hydrated && !app.state.session) {
    return <NeedSession />;
  }

  const working: typeof app.state.previews = [];
  const waiting: typeof app.state.previews = [];
  for (const item of app.state.previews) {
    if (item.state === "要確認") {
      waiting.push(item);
    } else if (item.state === "作業中" || item.state === "反映済み") {
      working.push(item);
    }
  }
  let reviewWait = 0;
  for (const project of app.state.projects) {
    if (project.rowState === "検証待ち") {
      reviewWait += 1;
    }
  }
  const liveThisWeek = app.state.prodHistory.length > 0 ? 1 : 0;

  const rows: typeof app.state.projects = [];
  for (const project of app.state.projects) {
    if (filter === "work" && project.rowState !== "作業中") {
      continue;
    }
    if (filter === "wait" && project.rowState !== "要確認") {
      continue;
    }
    if (
      query.trim().length > 0 &&
      !project.name.toLowerCase().includes(query.trim().toLowerCase())
    ) {
      continue;
    }
    rows.push(project);
  }

  const openProject = (id: string, creating: boolean) => {
    router.push(creating ? `/p/${id}/creating` : `/p/${id}`);
  };

  return (
    <main className={`stack ${fontVariables}`}>
      <div className="desk">
        <StackChrome current="projects" />
        <section className="page">
          {app.state.returnSummary ? (
            <>
              <p className="kicker">
                おかえりなさい · 最後に見たのは昨日 18:12
              </p>
              <h1>留守中に、2つ進みました。</h1>
              <div className="resume-list">
                <button
                  className="card elev-sm resume-card resume-wait"
                  onClick={() => {
                    app.dismissSummary();
                    app.askQuestion("task-board", "login");
                    router.push("/p/task-board?preview=login");
                  }}
                  type="button"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ display: "flex", gap: 10 }}>
                      <span className="card-title" style={{ fontSize: 18 }}>
                        ログイン導線
                      </span>
                      <span className="tag tag-accent-2">あなたの返事待ち</span>
                    </span>
                    <span className="lede">task-board · 昨日 18:40</span>
                  </div>
                  <span>
                    どのログイン方法を足しますか？ — GitHub / メール / 両方
                  </span>
                  <span style={{ color: "var(--color-accent-700)" }}>
                    答える →
                  </span>
                </button>
                <button
                  className="card elev-sm resume-card"
                  onClick={() => {
                    app.dismissSummary();
                    router.push("/p/task-board?preview=mobile");
                  }}
                  type="button"
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ display: "flex", gap: 10 }}>
                      <span className="card-title" style={{ fontSize: 18 }}>
                        モバイルUI
                      </span>
                      <span className="tag tag-accent">できました</span>
                    </span>
                    <span className="lede">task-board · 5分前</span>
                  </div>
                  <span>一覧を「今日やること」と「完了」に分けました。</span>
                  <span style={{ color: "var(--color-accent-700)" }}>
                    開く →
                  </span>
                </button>
              </div>
              <button
                className="btn btn-ghost"
                onClick={app.dismissSummary}
                type="button"
              >
                すべてのプロジェクトを見る →
              </button>
            </>
          ) : (
            <>
              <div className="page-head">
                <div>
                  <h1>プロジェクト</h1>
                  <p className="lede">
                    開いて話すだけ。あとはこちらで用意します。
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setOpen(true)}
                  type="button"
                >
                  ＋ 新しいプロジェクト
                </button>
              </div>
              <div className="stats">
                <article className="stat">
                  <span>作業中</span>
                  <strong>{working.length}</strong>
                </article>
                <article className="stat">
                  <span>要確認</span>
                  <strong>{waiting.length}</strong>
                </article>
                <article className="stat">
                  <span>検証待ち</span>
                  <strong>{reviewWait}</strong>
                </article>
                <article className="stat">
                  <span>今週の本番反映</span>
                  <strong>{liveThisWeek}</strong>
                </article>
              </div>
              <div className="filters">
                <div className="seg">
                  {(
                    [
                      ["all", "すべて"],
                      ["work", "作業中"],
                      ["wait", "要確認"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      className={`seg-opt ${filter === id ? "is-on" : ""}`}
                      key={id}
                      onClick={() => setFilter(id)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  className="input"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="検索"
                  value={query}
                />
              </div>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>プロジェクト</th>
                      <th>最新のプレビュー</th>
                      <th>状態</th>
                      <th>本番URL</th>
                      <th>更新</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6}>まだありません。新規から作れます。</td>
                      </tr>
                    ) : null}
                    {rows.map((project) => (
                      <tr key={project.id}>
                        <td>{project.name}</td>
                        <td>{project.latestPreview}</td>
                        <td>
                          <span className={previewTagClass(project.rowState)}>
                            {project.rowState}
                          </span>
                        </td>
                        <td className="mono">{project.liveUrl || "—"}</td>
                        <td>{project.updated}</td>
                        <td>
                          <button
                            className="btn btn-ghost"
                            onClick={() =>
                              openProject(
                                project.id,
                                project.status === "creating"
                              )
                            }
                            type="button"
                          >
                            開く →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
      <div className="hand">
        <section className="hand-page">
          <p className="kicker">一覧</p>
          <h1>プロジェクト</h1>
          {rows.map((project) => (
            <article className="card" key={project.id}>
              <h2>{project.name}</h2>
              <span className={previewTagClass(project.rowState)}>
                {project.rowState}
              </span>
              <button
                className="btn btn-primary"
                onClick={() =>
                  openProject(project.id, project.status === "creating")
                }
                type="button"
              >
                開く
              </button>
            </article>
          ))}
          <button
            className="btn btn-primary btn-block"
            onClick={() => setOpen(true)}
            type="button"
          >
            ＋ 新しいプロジェクト
          </button>
        </section>
        <MobileNav current="projects" />
      </div>
      {open ? (
        <div className="dialog-back">
          <form
            className="dialog"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = name.trim();
              if (trimmed.length === 0) {
                return;
              }
              const id = app.createProject(trimmed);
              setOpen(false);
              setName("");
              router.push(`/p/${id}/creating`);
            }}
          >
            <h2 className="dialog-title">新しいプロジェクト</h2>
            <p className="lede">名前だけ。あとはこちらで用意します。</p>
            <p className="kicker">自動で用意されるもの</p>
            <ul className="lede">
              <li>ソース置き場 owner/名前</li>
              <li>実行環境</li>
              <li>名前.pages.dev</li>
              <li>データ置き場 team/名前</li>
            </ul>
            <input
              className="input"
              onChange={(event) => setName(event.target.value)}
              placeholder="task-board"
              value={name}
            />
            <div className="dialog-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setOpen(false)}
                type="button"
              >
                やめる
              </button>
              <button className="btn btn-primary" type="submit">
                作ってエディタへ
              </button>
            </div>
          </form>
        </div>
      ) : null}
      <Toast />
    </main>
  );
};
