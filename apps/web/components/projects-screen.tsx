"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import { MobileNav } from "./mobile-nav";
import { NeedSession } from "./need-session";
import { StackChrome } from "./stack-chrome";

type Filter = "all" | "creating" | "ready";

export const ProjectsScreen = () => {
  const app = useMockApp();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  if (app.hydrated && !app.state.session) {
    return <NeedSession />;
  }

  const rows = app.state.projects.filter((project) =>
    filter === "all" ? true : project.status === filter
  );
  const readyCount = app.state.projects.filter(
    (project) => project.status === "ready"
  ).length;
  const [last] = app.state.projects;

  return (
    <main className={`stack ${fontVariables}`}>
      <div className="desk">
        <StackChrome progress={`${app.connectedCount}/4`} />
        <section className="page">
          <p className="kicker">プロジェクト</p>
          <h1>一覧</h1>
          <div className="stats">
            <article className="stat">
              <span>件数</span>
              <strong>{app.state.projects.length}</strong>
            </article>
            <article className="stat">
              <span>本番あり</span>
              <strong>{readyCount}</strong>
            </article>
            <article className="stat">
              <span>作成中</span>
              <strong>{app.state.projects.length - readyCount}</strong>
            </article>
          </div>
          {last ? (
            <p className="resume">
              前回は「{last.name}」を見ていました。
              <button
                className="btn btn-ghost"
                onClick={() =>
                  router.push(
                    last.status === "creating"
                      ? `/p/${last.id}/creating`
                      : `/p/${last.id}`
                  )
                }
                type="button"
              >
                戻る
              </button>
            </p>
          ) : null}
          <div className="filters">
            {(
              [
                ["all", "すべて"],
                ["ready", "本番あり"],
                ["creating", "作成中"],
              ] as const
            ).map(([id, label]) => (
              <button
                className={`btn ${filter === id ? "btn-solid" : "btn-ghost"}`}
                key={id}
                onClick={() => setFilter(id)}
                type="button"
              >
                {label}
              </button>
            ))}
            <button
              className="btn btn-solid"
              onClick={() => setOpen(true)}
              type="button"
            >
              新規
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>名前</th>
                  <th>状態</th>
                  <th>最後の会話</th>
                  <th>本番</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4}>まだありません。新規から作れます。</td>
                  </tr>
                ) : null}
                {rows.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() =>
                          router.push(
                            project.status === "creating"
                              ? `/p/${project.id}/creating`
                              : `/p/${project.id}`
                          )
                        }
                        type="button"
                      >
                        {project.name}
                      </button>
                    </td>
                    <td>
                      {project.status === "creating" ? "作成中" : "使える"}
                    </td>
                    <td>{project.lastTalk}</td>
                    <td>{project.liveUrl || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <div className="hand">
        <section className="hand-page">
          <p className="kicker">一覧</p>
          <h1>プロジェクト</h1>
          {rows.map((project) => (
            <article className="service-card" key={project.id}>
              <h2>{project.name}</h2>
              <p>{project.status === "creating" ? "作成中" : "使える"}</p>
              <button
                className="btn btn-solid"
                onClick={() =>
                  router.push(
                    project.status === "creating"
                      ? `/p/${project.id}/creating`
                      : `/p/${project.id}`
                  )
                }
                type="button"
              >
                開く
              </button>
            </article>
          ))}
          <button
            className="btn btn-solid"
            onClick={() => setOpen(true)}
            type="button"
          >
            新規
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
            <h2>新しいプロジェクト</h2>
            <p className="lede">名前だけ。あとはこちらで用意します。</p>
            <p className="lede">自動で用意されるもの</p>
            <ul className="lede">
              <li>ソース置き場 owner/名前</li>
              <li>実行環境</li>
              <li>名前.pages.dev</li>
              <li>データ置き場 team/名前</li>
            </ul>
            <input
              onChange={(event) => setName(event.target.value)}
              placeholder="お店の予約"
              value={name}
            />
            <button className="btn btn-solid" type="submit">
              作ってエディタへ
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setOpen(false)}
              type="button"
            >
              やめる
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
};
