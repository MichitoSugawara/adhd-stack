"use client";

import { useEffect, useRef, useState } from "react";

import { fontVariables } from "../lib/fonts";
import { CREATE_STEPS } from "../lib/mock-seed";
import { useMockApp } from "../lib/mock-store";
import { stepClass, stepMark } from "../lib/preview-ui";
import { NeedSession } from "./need-session";
import { StackChrome } from "./stack-chrome";
import { Toast } from "./toast";

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
  const jumped = useRef(false);

  useEffect(() => {
    if (!(hydrated && projectId) || ready) {
      return;
    }
    const timer = window.setTimeout(() => {
      advanceRef.current(projectId, currentStep + 1);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [currentStep, hydrated, projectId, ready]);

  useEffect(() => {
    if (!ready || jumped.current) {
      return;
    }
    jumped.current = true;
    window.location.assign(`/p/${projectId}?preview=${projectId}-first`);
  }, [projectId, ready]);

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
      <section className="page creating">
        <div>
          <p className="kicker">用意しています</p>
          <h1>{project.name} をつくっています。</h1>
          <ol className="steps">
            {CREATE_STEPS.map((label, index) => {
              const done = index < project.creatingStep;
              const now = index === project.creatingStep && !ready;
              return (
                <li className={stepClass(done, now)} key={label}>
                  <span className="mark">{stepMark(done, now)}</span>
                  {label}
                </li>
              );
            })}
          </ol>
          <p className="lede">
            この画面を閉じても進みます。終わったら通知します。
          </p>
        </div>
        <div className="card">
          <span className="card-title">
            待っている間に、最初の指示を書いておけます
          </span>
          <textarea
            className="input"
            onChange={(event) => setNote(event.target.value)}
            rows={5}
            value={note}
          />
          <button
            className="btn btn-primary"
            onClick={() => app.reservePrompt(project.id, note)}
            type="button"
          >
            予約して始める
          </button>
        </div>
      </section>
      <Toast />
    </main>
  );
};
