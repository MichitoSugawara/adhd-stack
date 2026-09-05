"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { fontVariables } from "../lib/fonts";
import { CREATE_STEPS } from "../lib/mock-seed";
import { useMockApp } from "../lib/mock-store";
import { NeedSession } from "./need-session";
import { StackChrome } from "./stack-chrome";

interface CreatingScreenProperties {
  projectId: string;
}

export const CreatingScreen = ({ projectId }: CreatingScreenProperties) => {
  const app = useMockApp();
  const project = app.state.projects.find((item) => item.id === projectId);
  const [note, setNote] = useState(project?.reservedPrompt ?? "");
  const { advanceCreate, hydrated } = app;
  const currentStep = project?.creatingStep ?? 0;
  const ready = project?.status === "ready";
  const advanceRef = useRef(advanceCreate);
  advanceRef.current = advanceCreate;

  useEffect(() => {
    if (!(hydrated && projectId) || ready) {
      return;
    }
    const timer = window.setTimeout(() => {
      advanceRef.current(projectId, currentStep + 1);
    }, 700);
    return () => window.clearTimeout(timer);
  }, [currentStep, hydrated, projectId, ready]);

  if (hydrated && !app.state.session) {
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
        <p className="kicker">作成中</p>
        <h1>{project.name}</h1>
        <p className="lede">5つの用意が終わるまで、指示を予約できます。</p>
        <ol className="steps">
          {CREATE_STEPS.map((label, index) => (
            <li
              className={index < project.creatingStep ? "is-done" : undefined}
              key={label}
            >
              {index < project.creatingStep ? "済" : "待"} {label}
            </li>
          ))}
        </ol>
        {ready ? (
          <Link className="btn btn-solid" href={`/p/${project.id}`}>
            作業を開く
          </Link>
        ) : (
          <label className="dialog">
            指示の予約
            <textarea
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              value={note}
            />
            <button
              className="btn btn-ghost"
              onClick={() => app.reservePrompt(project.id, note)}
              type="button"
            >
              予約する
            </button>
          </label>
        )}
      </section>
    </main>
  );
};
