"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { fontVariables } from "../lib/fonts";
import { useMockApp } from "../lib/mock-store";
import type { EnvLane, Preview } from "../lib/mock-types";
import { NeedSession } from "./need-session";
import { OverlapDialog } from "./overlap-dialog";
import { StackChrome } from "./stack-chrome";

const isEnvLane = (value: string): value is EnvLane =>
  value === "draft" || value === "live" || value === "review";

const laneLabel = (lane: EnvLane): string => {
  if (lane === "draft") {
    return "プレビュー";
  }
  if (lane === "review") {
    return "検証";
  }
  return "本番";
};

interface EnvsScreenProperties {
  projectId: string;
}

const Lane = ({
  items,
  onLive,
  onOverlap,
  onReview,
  title,
}: {
  items: Preview[];
  onLive: (id: string) => void;
  onOverlap: () => void;
  onReview: (id: string) => void;
  title: string;
}) => (
  <section className="lane">
    <h2>{title}</h2>
    {items.length === 0 ? <p className="lede">まだありません</p> : null}
    {items.map((item) => (
      <article className="service-card" key={item.id}>
        <strong>{item.title}</strong>
        <p className="mono">{item.url}</p>
        {item.kind === "draft" ? (
          <button
            className="btn btn-solid"
            onClick={() => onReview(item.id)}
            type="button"
          >
            検証へ送る
          </button>
        ) : null}
        {item.kind === "review" ? (
          <>
            <button
              className="btn btn-solid"
              onClick={() => onLive(item.id)}
              type="button"
            >
              本番へ反映
            </button>
            <button className="btn btn-ghost" onClick={onOverlap} type="button">
              重なりを見る
            </button>
          </>
        ) : null}
        {item.kind === "live" ? (
          <button className="btn btn-ghost" onClick={onOverlap} type="button">
            前の版に戻す
          </button>
        ) : null}
      </article>
    ))}
  </section>
);

export const EnvsScreen = ({ projectId }: EnvsScreenProperties) => {
  const app = useMockApp();
  const router = useRouter();
  const project = app.state.projects.find((item) => item.id === projectId);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [lane, setLane] = useState<EnvLane>("review");
  const [restored, setRestored] = useState(false);
  const drafts: Preview[] = [];
  const reviews: Preview[] = [];
  const lives: Preview[] = [];
  for (const item of app.state.previews) {
    if (item.projectId !== projectId) {
      continue;
    }
    if (item.kind === "draft") {
      drafts.push(item);
    } else if (item.kind === "review") {
      reviews.push(item);
    } else {
      lives.push(item);
    }
  }

  if (app.hydrated && !app.state.session) {
    return <NeedSession />;
  }

  if (!project) {
    return (
      <main className={`stack ${fontVariables}`}>
        <StackChrome />
        <section className="page">
          <h1>見つかりません</h1>
        </section>
      </main>
    );
  }

  return (
    <main className={`stack ${fontVariables}`}>
      <StackChrome />
      <section className="page">
        <p className="kicker">環境</p>
        <h1>{project.name}</h1>
        <p className="lede">
          プレビュー、検証、本番。鍵と設定もここに置きます。
        </p>
        <div className="envs">
          <Lane
            items={drafts}
            onLive={(id) => app.promote(id, "live")}
            onOverlap={() => app.setOverlap(true)}
            onReview={(id) => app.promote(id, "review")}
            title="プレビュー"
          />
          <Lane
            items={reviews}
            onLive={(id) => app.promote(id, "live")}
            onOverlap={() => app.setOverlap(true)}
            onReview={(id) => app.promote(id, "review")}
            title="検証"
          />
          <Lane
            items={lives}
            onLive={() => setRestored(true)}
            onOverlap={() => setRestored(true)}
            onReview={() => setRestored(true)}
            title="本番"
          />
        </div>
        <form
          className="dialog secret-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (key.trim().length === 0) {
              return;
            }
            app.addSecret(key.trim(), value, lane);
            setKey("");
            setValue("");
          }}
        >
          <h2>鍵と設定</h2>
          <input
            onChange={(event) => setKey(event.target.value)}
            placeholder="名前"
            value={key}
          />
          <input
            onChange={(event) => setValue(event.target.value)}
            placeholder="値"
            value={value}
          />
          <select
            onChange={(event) => {
              if (isEnvLane(event.target.value)) {
                setLane(event.target.value);
              }
            }}
            value={lane}
          >
            <option value="draft">プレビュー</option>
            <option value="review">検証</option>
            <option value="live">本番</option>
          </select>
          <button className="btn btn-solid" type="submit">
            足す
          </button>
          <ul>
            {app.state.secrets.map((secret) => (
              <li key={`${secret.lane}-${secret.key}`}>
                {secret.key} · {laneLabel(secret.lane)}
              </li>
            ))}
          </ul>
        </form>
        <button
          className="btn btn-ghost"
          onClick={() => router.push(`/p/${projectId}`)}
          type="button"
        >
          作業へ戻る
        </button>
      </section>
      <OverlapDialog
        onClose={() => app.setOverlap(false)}
        overlap={app.state.overlap}
      />
      {restored ? (
        <div className="dialog-back">
          <div className="dialog">
            <h2>前の版に戻す</h2>
            <p className="lede">本番を、ひとつ前の保存ポイントに戻しました。</p>
            <button
              className="btn btn-solid"
              onClick={() => setRestored(false)}
              type="button"
            >
              閉じる
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
};
