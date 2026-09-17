"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import {
  clearNewAppDraft,
  readNewAppDraft,
  saveAppIdeaDraft,
  saveNewAppDraft,
  useNewAppDraft,
} from "@/lib/app-draft";
import { useCreateNamedApp } from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";
import { useConnectionsPort } from "@/lib/connections-port";
import { hasConvexUrl } from "@/lib/env";
import { writeLastWorkspace } from "@/lib/last-workspace";
import { useShell } from "@/lib/shell-state";

import "./workspace-home.css";

const IDEA_STARTERS = [
  {
    description:
      "今日いちばん大切なタスクを一つ選び、完了したら次のタスクに進める、シンプルなタスク管理アプリを作りたい。",
    label: "やることを、ひとつずつ",
    name: "今日のひとつ",
    symbol: "check",
  },
  {
    description:
      "思いついたことをすぐに書き留められるメモアプリを作りたい。後からキーワードで探して、気に入ったメモをピン留めしたい。",
    label: "思いつきを、逃さない",
    name: "ひらめきノート",
    symbol: "note",
  },
  {
    description:
      "今日の気分と、よかったことを一行で残せる日記アプリを作りたい。カレンダーから過去の記録を振り返りたい。",
    label: "小さな日々を、残す",
    name: "わたしの記録",
    symbol: "sun",
  },
] as const;

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

const IdeaIcon = ({ kind }: { kind: string }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="21"
    viewBox="0 0 24 24"
    width="21"
  >
    {kind === "check" ? (
      <path
        d="m6 12 4 4 8-9M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    ) : null}
    {kind === "note" ? (
      <path
        d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 13h8m-8 4h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    ) : null}
    {kind === "sun" ? (
      <>
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        />
      </>
    ) : null}
  </svg>
);

const NewHome = ({
  blockedNote,
  failNote,
  offline = false,
  onCreate,
  pending,
}: {
  blockedNote: string | null;
  failNote: string | null;
  offline?: boolean;
  onCreate: (name: string, idea: string) => void;
  pending: boolean;
}) => {
  const draft = useNewAppDraft();
  const blocked = blockedNote !== null;
  const { name } = draft;
  const { idea } = draft;
  let submitLabel = offline ? "画面をプレビュー" : "アプリをつくる";
  if (pending) {
    submitLabel = "準備しています…";
  }

  return (
    <main className="workspace-scroll">
      <div className="new-workspace">
        <Link className="new-back-link" href="/projects">
          <span aria-hidden="true">←</span> アプリ一覧に戻る
        </Link>
        <header className="new-heading">
          <p className="ui-eyebrow">MAKE ROOM FOR AN IDEA</p>
          <h1>
            次は、何をつくろう<span>.</span>
          </h1>
          <p>
            まだ、はっきりしたアイデアでなくても。
            <br className="new-mobile-break" />
            小さな「ほしい」からはじめましょう。
          </p>
        </header>
        <div className="new-layout">
          <form
            className="new-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!blocked && !pending && name.trim()) {
                onCreate(name.trim(), idea.trim());
              }
            }}
          >
            <div className="new-step-heading">
              <span>01</span>
              <h2>アプリに名前をつける</h2>
            </div>
            <label className="new-field-label" htmlFor="new-app-name">
              アプリの名前 <span>必須</span>
            </label>
            <input
              autoComplete="off"
              className="new-name-input"
              data-app-name
              disabled={pending}
              id="new-app-name"
              maxLength={80}
              onChange={(event) => {
                saveNewAppDraft({ idea, name: event.target.value });
              }}
              placeholder="例：ひらめきノート"
              required
              value={name}
            />
            <p className="new-field-hint">
              自分が見つけやすい名前をつけましょう。
            </p>

            <div className="new-step-heading new-step-heading-second">
              <span>02</span>
              <h2>
                アイデアを書き留める <small>任意</small>
              </h2>
            </div>
            <label className="sr-only" htmlFor="new-app-idea">
              つくりたいアプリのアイデア
            </label>
            <textarea
              className="new-idea-input"
              disabled={pending}
              id="new-app-idea"
              maxLength={4000}
              onChange={(event) => {
                saveNewAppDraft({ idea: event.target.value, name });
              }}
              placeholder="誰が、どんなときに使うアプリ？ できるようにしたいことを、いつもの言葉で。"
              rows={5}
              value={idea}
            />
            <p className="new-field-hint">
              チャットの下書きとして引き継ぎます。AI への送信は、作成後に。
            </p>

            {blockedNote ? (
              <div className="new-connection-notice" role="status">
                <span aria-hidden="true" className="new-connection-symbol">
                  ↗
                </span>
                <div>
                  <strong>つくりはじめる準備をしましょう</strong>
                  <p>{blockedNote}</p>
                  <Link href="/connect?returnTo=%2Fnew">
                    サービスを接続する <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            ) : null}
            {offline ? (
              <div className="new-offline-note">
                <strong>UI プレビュー</strong>
                <p>
                  画面の流れを確認できます。アプリの作成や AI
                  への送信、公開は行われません。
                </p>
              </div>
            ) : null}
            {failNote ? (
              <p className="new-error" role="alert">
                {failNote}
              </p>
            ) : null}

            <div className="new-submit-row">
              <span>
                {pending
                  ? "アプリを準備しています…"
                  : "入力はこのタブに保存されます"}
              </span>
              <button
                className="ui-button ui-button-accent"
                disabled={blocked || pending || !name.trim()}
                type="submit"
              >
                {submitLabel}
                {pending ? (
                  <span aria-hidden="true" className="new-spinner" />
                ) : (
                  <ArrowIcon />
                )}
              </button>
            </div>
          </form>

          <aside className="new-aside">
            <div aria-hidden="true" className="new-idea-art">
              <svg fill="none" viewBox="0 0 280 208">
                <path d="M48 166 141 112l93 54-93 54-93-54Z" fill="#e4e8df" />
                <path
                  d="m48 129 93-54 93 54-93 54-93-54Z"
                  fill="#f8f9f5"
                  stroke="#b9c2ae"
                />
                <path
                  d="m48 92 93-54 93 54-93 54-93-54Z"
                  fill="#fff"
                  stroke="#b9c2ae"
                />
                <path d="m83 92 58-33 58 33-58 34-58-34Z" stroke="#d3d9cb" />
                <path
                  d="M140 67v50m-25-36 50 23m0-23-50 23"
                  stroke="#b84f35"
                  strokeLinecap="round"
                  strokeWidth="1.5"
                />
                <path
                  d="M226 36v18m-9-9h18M40 51v12m-6-6h12"
                  stroke="#b84f35"
                  strokeLinecap="round"
                />
                <circle cx="61" cy="190" r="3" fill="#b84f35" />
              </svg>
            </div>
            <p className="ui-eyebrow">FROM IDEA TO EVERYDAY</p>
            <h2>{name.trim() || "あなたの、次のアイデア。"}</h2>
            <p className="new-aside-description">
              {idea.trim() ||
                "頭の中にあるものを、毎日使えるものに。必要なことは、会話で少しずつ。"}
            </p>
            <ol className="new-journey">
              <li className="is-current">
                <span>1</span>
                <div>
                  <strong>アイデアを置く</strong>
                  <p>名前と、つくりたいこと。</p>
                </div>
              </li>
              <li>
                <span>2</span>
                <div>
                  <strong>会話しながら育てる</strong>
                  <p>AI と相談して、形にします。</p>
                </div>
              </li>
              <li>
                <span>3</span>
                <div>
                  <strong>自分のアプリを使う</strong>
                  <p>確かめて、準備ができたら公開。</p>
                </div>
              </li>
            </ol>
          </aside>
        </div>

        <section aria-label="アイデアのヒント" className="new-inspiration">
          <div className="new-inspiration-heading">
            <h2>こんなアイデアから、どうですか。</h2>
            <span>選ぶと下書きに入ります</span>
          </div>
          <div className="new-starters">
            {IDEA_STARTERS.map((starter) => (
              <button
                className="new-starter"
                disabled={pending}
                key={starter.name}
                onClick={() => {
                  saveNewAppDraft({
                    idea: starter.description,
                    name: starter.name,
                  });
                }}
                type="button"
              >
                <span
                  className={`new-starter-icon new-starter-${starter.symbol}`}
                >
                  <IdeaIcon kind={starter.symbol} />
                </span>
                <span>
                  <strong>{starter.name}</strong>
                  <small>{starter.label}</small>
                </span>
                <span className="new-starter-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

const NewLive = () => {
  const router = useRouter();
  const port = useConnectionsPort();
  const createApp = useCreateNamedApp();
  const [pending, setPending] = useState(false);
  const [failNote, setFailNote] = useState<string | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  let blockedNote: string | null =
    "サービスの接続を確認しています。アイデアを書きながら、少しお待ちください。";
  if (port.board) {
    blockedNote = port.board.allConnected
      ? null
      : "必要なサービスを接続すると、アプリを作成できます。ここに書いた内容はそのまま残ります。";
  }

  const onCreate = async (name: string, idea: string) => {
    if (!name.trim() || pending || !port.board?.allConnected) {
      return;
    }
    setPending(true);
    setFailNote(null);
    try {
      const created = await createApp({ name: name.trim() });
      writeLastWorkspace({
        name: name.trim(),
        path: `/p/${created.slug}/creating`,
        slug: created.slug,
      });
      saveAppIdeaDraft(created.slug, idea);
      const currentDraft = readNewAppDraft();
      if (
        currentDraft.name.trim() === name.trim() &&
        currentDraft.idea.trim() === idea.trim()
      ) {
        clearNewAppDraft();
      }
      if (mounted.current) {
        router.push(`/p/${created.slug}/creating`);
      }
    } catch (error) {
      if (mounted.current) {
        setFailNote(connectErrorMessage(error));
        setPending(false);
      }
    }
  };

  return (
    <NewHome
      blockedNote={blockedNote}
      failNote={failNote}
      onCreate={(name, idea) => {
        void onCreate(name, idea);
      }}
      pending={pending}
    />
  );
};

const NewOffline = () => {
  const router = useRouter();
  const shell = useShell();
  return (
    <NewHome
      blockedNote={null}
      failNote={null}
      offline
      onCreate={(name, idea) => {
        if (!name.trim()) {
          return;
        }
        const id = shell.createApp(name.trim());
        writeLastWorkspace({
          name: name.trim(),
          path: `/p/${id}/creating`,
          slug: id,
        });
        saveAppIdeaDraft(id, idea);
        clearNewAppDraft();
        router.push(`/p/${id}/creating`);
      }}
      pending={false}
    />
  );
};

export const NewScreen = () => (
  <ShellGate>
    <AppFrame>{hasConvexUrl() ? <NewLive /> : <NewOffline />}</AppFrame>
  </ShellGate>
);
