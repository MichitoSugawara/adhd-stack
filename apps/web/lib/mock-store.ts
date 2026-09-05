"use client";

import { useEffect, useState } from "react";

import { emptyConnections, emptyState, initialState } from "./mock-seed";
import type {
  AppState,
  ConnectionStatus,
  EnvLane,
  Message,
  Preview,
  Project,
  ProjectStatus,
} from "./mock-types";
import { previewUrl, slugOf } from "./preview-ui";
import type { ServiceId } from "./services";
import { SERVICES } from "./services";

export const STORAGE_KEY = "adhd-stack-demo-v3";
const EVENT = "adhd-stack";

let talkGen = 0;
let toastGen = 0;

const asState = (value: unknown): AppState => {
  if (typeof value !== "object" || value === null) {
    return emptyState();
  }
  const row = value as Partial<AppState>;
  const next = emptyState();
  if (row.session && typeof row.session === "object") {
    next.session = row.session;
  }
  if (row.connections && typeof row.connections === "object") {
    next.connections = { ...emptyConnections(), ...row.connections };
  }
  if (Array.isArray(row.projects)) {
    next.projects = row.projects;
  }
  if (Array.isArray(row.previews)) {
    next.previews = row.previews;
  }
  if (row.messages && typeof row.messages === "object") {
    next.messages = row.messages;
  }
  if (typeof row.openaiKey === "string") {
    next.openaiKey = row.openaiKey;
  }
  if (typeof row.reservedPrompt === "string") {
    next.reservedPrompt = row.reservedPrompt;
  }
  if (Array.isArray(row.secrets)) {
    next.secrets = row.secrets;
  }
  if (Array.isArray(row.history)) {
    next.history = row.history;
  }
  if (Array.isArray(row.terminal)) {
    next.terminal = row.terminal;
  }
  if (Array.isArray(row.prodHistory)) {
    next.prodHistory = row.prodHistory;
  }
  if (Array.isArray(row.sideMessages)) {
    next.sideMessages = row.sideMessages;
  }
  if (row.banner) {
    next.banner = row.banner;
  }
  if (row.overlap) {
    next.overlap = row.overlap;
  }
  if (typeof row.busy === "boolean") {
    next.busy = row.busy;
  }
  if (typeof row.dirty === "boolean") {
    next.dirty = row.dirty;
  }
  if (typeof row.deployFailed === "boolean") {
    next.deployFailed = row.deployFailed;
  }
  if (typeof row.returnSummary === "boolean") {
    next.returnSummary = row.returnSummary;
  }
  if (typeof row.usage === "number") {
    next.usage = row.usage;
  }
  if (typeof row.staging === "number") {
    next.staging = row.staging;
  }
  if (typeof row.prod === "number") {
    next.prod = row.prod;
  }
  if (typeof row.toast === "string") {
    next.toast = row.toast;
  }
  if (row.connecting) {
    next.connecting = row.connecting;
  }
  if (row.failed) {
    next.failed = row.failed;
  }
  return next;
};

export const readState = (): AppState => {
  if (typeof window === "undefined") {
    return emptyState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? asState(JSON.parse(raw)) : emptyState();
  } catch {
    return emptyState();
  }
};

export const writeState = (state: AppState): void => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  queueMicrotask(() => {
    window.dispatchEvent(new Event(EVENT));
  });
};

export const connectedCount = (connections: AppState["connections"]): number =>
  SERVICES.filter((service) => connections[service.id].status === "connected")
    .length;

export const allConnected = (connections: AppState["connections"]): boolean =>
  connectedCount(connections) === SERVICES.length;

const wait = async (ms: number) =>
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const serviceMeta = (id: ServiceId): string => {
  const found = SERVICES.find((item) => item.id === id);
  return found?.meta ?? id;
};

const nextFailed = (
  status: ConnectionStatus,
  id: ServiceId,
  current: ServiceId | null
): ServiceId | null => {
  if (status === "failed") {
    return id;
  }
  if (current === id) {
    return null;
  }
  return current;
};

export const useMockApp = () => {
  const [state, setState] = useState<AppState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => {
      setState(readState());
      setHydrated(true);
    };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const write = (next: AppState | ((prev: AppState) => AppState)) => {
    setState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      writeState(value);
      return value;
    });
  };

  const toast = (text: string) => {
    toastGen += 1;
    const stamp = toastGen;
    write((prev) => ({ ...prev, toast: text }));
    window.setTimeout(() => {
      if (stamp !== toastGen) {
        return;
      }
      write((prev) => (prev.toast === text ? { ...prev, toast: "" } : prev));
    }, 2600);
  };

  const signIn = () => {
    write((prev) => ({
      ...prev,
      session: { email: "michito@gmail.com", name: "MS" },
    }));
  };

  const signOut = () => {
    write(emptyState());
  };

  const setConnection = (
    id: ServiceId,
    status: ConnectionStatus,
    identity: string,
    error?: string
  ) => {
    write((prev) => {
      const next = {
        ...prev,
        connecting: status === "connecting" ? id : null,
        connections: {
          ...prev.connections,
          [id]: { error, identity, status },
        },
        failed: nextFailed(status, id, prev.failed),
      };
      if (status === "failed") {
        next.banner = {
          text: `${identity} がつながりませんでした。`,
          tone: "fail",
        };
      }
      if (status === "disconnected") {
        next.banner = {
          text: `${identity} のトークンが期限切れです。つなぎ直すと自動でセッションに戻ります。`,
          tone: "disconnect",
        };
      }
      if (status === "connected") {
        next.banner = null;
        next.failed = null;
        if (allConnected(next.connections) && prev.projects.length === 0) {
          const packed = initialState();
          next.projects = packed.projects;
          next.previews = packed.previews;
          next.messages = packed.messages;
          next.history = packed.history;
          next.terminal = packed.terminal;
          next.secrets = packed.secrets;
          next.sideMessages = packed.sideMessages;
          next.prodHistory = packed.prodHistory;
          next.returnSummary = packed.returnSummary;
          next.usage = packed.usage;
          next.dirty = packed.dirty;
          next.staging = packed.staging;
          next.prod = packed.prod;
        }
      }
      return next;
    });
  };

  const connectService = async (id: ServiceId, key?: string) => {
    if (id === "openai") {
      const trimmed = (key ?? state.openaiKey).trim();
      if (trimmed.length < 8) {
        setConnection("openai", "failed", "OpenAI Codex", "キーが短すぎます");
        return;
      }
      if (trimmed.toLowerCase() === "failfail") {
        setConnection(
          "openai",
          "failed",
          "OpenAI Codex",
          "キーを確認できません"
        );
        return;
      }
      write((prev) => ({ ...prev, openaiKey: trimmed }));
      setConnection("openai", "connecting", "確認中");
      await wait(420);
      setConnection("openai", "connected", serviceMeta("openai"));
      toast("OpenAI Codex をつなぎました");
      return;
    }
    setConnection(id, "connecting", "アカウントを選択中");
  };

  const finishConnect = (ok: boolean) => {
    const id = state.connecting;
    if (!id) {
      return;
    }
    if (ok) {
      setConnection(id, "connected", serviceMeta(id));
      toast(
        `${SERVICES.find((item) => item.id === id)?.label ?? id} をつなぎました`
      );
      if (state.banner) {
        window.setTimeout(() => {
          write((prev) => ({ ...prev, banner: null }));
        }, 400);
      }
      return;
    }
    setConnection(
      id,
      "failed",
      serviceMeta(id),
      "認可が拒否されました（access_denied）"
    );
  };

  const cancelConnect = () => {
    const id = state.connecting;
    if (!id) {
      return;
    }
    setConnection(id, "disconnected", "未選択");
  };

  const disconnectService = (id: ServiceId) => {
    setConnection(id, "disconnected", "未選択");
  };

  const createProject = (name: string): string => {
    const id = slugOf(name);
    const project: Project = {
      creatingStep: 0,
      id,
      latestPreview: "はじめに",
      liveUrl: "",
      name,
      reservedPrompt: "",
      rowState: "作成中",
      status: "creating",
      updated: "今",
    };
    write((prev) => ({
      ...prev,
      messages: { ...prev.messages, [id]: [] },
      projects: [project, ...prev.projects],
    }));
    return id;
  };

  const advanceCreate = (id: string, step: number) => {
    write((prev) => {
      const ready = step >= 5;
      const projects = prev.projects.map((project) => {
        if (project.id !== id) {
          return project;
        }
        const status: ProjectStatus = ready ? "ready" : "creating";
        return {
          ...project,
          creatingStep: Math.min(step, 5),
          rowState: ready ? "作業中" : "作成中",
          status,
        };
      });
      if (!ready) {
        return { ...prev, projects };
      }
      const hajime: Preview = {
        conflict: false,
        id: `${id}-first`,
        kind: "draft",
        projectId: id,
        savepoints: [],
        slug: "first",
        state: "作業中",
        title: "はじめに",
        url: previewUrl("first"),
      };
      const welcome: Message = {
        body: `${prev.projects.find((item) => item.id === id)?.name ?? id} の用意ができました。公開先とデータの置き場は揃っています。何を作りますか？`,
        id: `m_ready_${Date.now()}`,
        kind: "ai",
      };
      return {
        ...prev,
        messages: {
          ...prev.messages,
          [id]: [...(prev.messages[id] ?? []), welcome],
        },
        previews: [hajime, ...prev.previews],
        projects,
        toast: "できました — 最初の指示から始められます",
      };
    });
  };

  const reservePrompt = (id: string, text: string) => {
    write((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === id ? { ...project, reservedPrompt: text } : project
      ),
      reservedPrompt: text,
    }));
    toast("予約しました。終わったらここから始めます");
  };

  const appendMessage = (projectId: string, message: Omit<Message, "id">) => {
    write((prev) => {
      const list = prev.messages[projectId] ?? [];
      return {
        ...prev,
        messages: {
          ...prev.messages,
          [projectId]: [
            ...list,
            { ...message, id: `m_${list.length}_${Date.now()}` },
          ],
        },
        projects: prev.projects.map((project) =>
          project.id === projectId
            ? { ...project, latestPreview: project.latestPreview }
            : project
        ),
      };
    });
  };

  const sendTalk = async (
    projectId: string,
    text: string,
    previewId?: string
  ) => {
    if (state.busy || text.trim().length === 0) {
      return;
    }
    if (state.usage >= 100) {
      appendMessage(projectId, { body: text, kind: "user" });
      appendMessage(projectId, {
        body: "今日の上限に達しました",
        kind: "limit",
      });
      return;
    }
    talkGen += 1;
    const gen = talkGen;
    const short = text.slice(0, 22);
    write((prev) => ({
      ...prev,
      busy: true,
      previews: prev.previews.map((item) =>
        item.id === previewId ? { ...item, state: "作業中" } : item
      ),
    }));
    appendMessage(projectId, { body: text, kind: "user" });
    await wait(500);
    if (gen !== talkGen) {
      return;
    }
    appendMessage(projectId, {
      body: `「${text.slice(0, 18)}${text.length > 18 ? "…" : ""}」— 影響は page.tsx と globals.css に限られる。既存のデータ構造は変えない。`,
      kind: "thinking",
      meta: { seconds: "2秒" },
    });
    await wait(700);
    if (gen !== talkGen) {
      return;
    }
    appendMessage(projectId, {
      body: "app/tasks/page.tsx を編集中…",
      kind: "status",
    });
    await wait(600);
    if (gen !== talkGen) {
      return;
    }
    write((prev) => {
      const list = prev.messages[projectId] ?? [];
      const withoutStatus = list.filter((item) => item.kind !== "status");
      return {
        ...prev,
        dirty: true,
        messages: {
          ...prev.messages,
          [projectId]: [
            ...withoutStatus,
            {
              body: "typecheck",
              id: `m_cmd_${Date.now()}`,
              kind: "cmd",
              meta: {
                command: "pnpm --filter web typecheck",
                lines: [
                  "pnpm --filter web typecheck  ✓ 1.8s",
                  "pnpm --filter web lint  ✓",
                ],
              },
            },
          ],
        },
        terminal: [
          ...prev.terminal,
          { text: "$ pnpm --filter web typecheck", tone: "plain" },
          { text: "✓ 1.8s", tone: "ok" },
        ],
      };
    });
    await wait(500);
    if (gen !== talkGen) {
      return;
    }
    appendMessage(projectId, {
      body: "プレビューに反映しています…",
      kind: "status",
    });
    await wait(700);
    if (gen !== talkGen) {
      return;
    }
    write((prev) => {
      const list = prev.messages[projectId] ?? [];
      const cleaned: Message[] = [];
      for (const item of list) {
        if (item.kind !== "status") {
          cleaned.push(item);
        }
      }
      return {
        ...prev,
        busy: false,
        dirty: true,
        history: [
          {
            current: true,
            id: `h_${Date.now()}`,
            meta: "2ファイル · +15 −3 · 自動保存",
            title: short,
            when: "今",
            where: "preview" as const,
          },
          ...prev.history.map((point) => ({ ...point, current: false })),
        ],
        messages: {
          ...prev.messages,
          [projectId]: [
            ...cleaned,
            {
              body: "反映しました。右の「画面」で確認できます。気になる所があれば、そのまま話しかけてください。",
              id: `m_ai_${Date.now()}`,
              kind: "ai" as const,
            },
            {
              body: "2ファイル",
              id: `m_ch_${Date.now()}`,
              kind: "changes" as const,
              meta: {
                additions: 15,
                deletions: 3,
                files: [
                  {
                    add: "+11",
                    del: "−3",
                    file: "app/tasks/page.tsx",
                    lines: [
                      {
                        kind: "add",
                        text: "  const open = tasks.filter((t) => !t.done);",
                      },
                      { kind: "del", text: "      <h1>タスク</h1>" },
                    ],
                  },
                  {
                    add: "+4",
                    del: "",
                    file: "app/globals.css",
                    lines: [{ kind: "add", text: ".muted { opacity: .5; }" }],
                  },
                ],
              },
            },
          ],
        },
        previews: prev.previews.map((item) =>
          item.id === previewId
            ? {
                ...item,
                savepoints: [{ title: short, when: "今" }, ...item.savepoints],
                state: "反映済み",
              }
            : item
        ),
        toast: "保存ポイントを自動で作りました",
        usage: Math.min(100, prev.usage + 9),
      };
    });
  };

  const stopTalk = (projectId: string) => {
    talkGen += 1;
    write((prev) => ({ ...prev, busy: false }));
    appendMessage(projectId, {
      body: "止めました。ここまでの変更は保存ポイントに残っています。",
      kind: "ai",
    });
  };

  const askQuestion = (projectId: string, previewId: string) => {
    write((prev) => {
      const list = prev.messages[projectId] ?? [];
      const hasQuestion = list.some((item) => item.kind === "question");
      if (hasQuestion) {
        return prev;
      }
      return {
        ...prev,
        messages: {
          ...prev.messages,
          [projectId]: [
            ...list,
            {
              body: "できます。先に1つだけ決めてください — メール＋パスワードを増やすと、パスワード再設定のメール送信が必要になります。",
              id: `m_qai_${Date.now()}`,
              kind: "ai",
            },
            {
              body: "どのログイン方法を足しますか？",
              id: `m_q_${Date.now()}`,
              kind: "question",
              meta: {
                options: [
                  { label: "GitHub ログイン", note: "追加設定なし。おすすめ" },
                  {
                    label: "メール＋パスワード",
                    note: "メール送信サービスのキーが必要",
                  },
                  { label: "両方" },
                ],
              },
            },
          ],
        },
        previews: prev.previews.map((item) =>
          item.id === previewId ? { ...item, state: "要確認" } : item
        ),
      };
    });
  };

  const answerQuestion = (
    projectId: string,
    previewId: string,
    label: string
  ) => {
    write((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [projectId]: (prev.messages[projectId] ?? []).filter(
          (item) => item.kind !== "question"
        ),
      },
      previews: prev.previews.map((item) =>
        item.id === previewId ? { ...item, state: "作業中" } : item
      ),
    }));
    void sendTalk(projectId, `${label} で進めて`, previewId);
  };

  const resolveApproval = (projectId: string, ok: boolean) => {
    write((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [projectId]: (prev.messages[projectId] ?? []).filter(
          (item) => item.kind !== "approval"
        ),
      },
    }));
    appendMessage(projectId, {
      body: ok
        ? "保存ポイント「削除前」を作ってから実行しました。7日以内なら履歴から戻せます。"
        : "わかりました。削除せず、別の方法に変えます。",
      kind: "ai",
    });
    if (ok) {
      toast("保存ポイント「削除前」を作りました");
    }
  };

  const resolveSecret = (projectId: string, ok: boolean) => {
    write((prev) => ({
      ...prev,
      messages: {
        ...prev.messages,
        [projectId]: (prev.messages[projectId] ?? []).filter(
          (item) => item.kind !== "secret"
        ),
      },
    }));
    if (ok) {
      toast("プレビュー用の鍵を保存しました");
      void sendTalk(projectId, "鍵を入れたので続けて");
      return;
    }
    appendMessage(projectId, {
      body: "了解です。鍵なしで進められる画面側だけ先に作っておきます。",
      kind: "ai",
    });
  };

  const resolveLimit = (projectId: string, reset: boolean) => {
    if (reset) {
      write((prev) => ({ ...prev, usage: 12 }));
      appendMessage(projectId, {
        body: "別の鍵で続けます。中断したところから再開しました。",
        kind: "ai",
      });
      return;
    }
    toast("14:00 に再開します。終わったら通知します");
  };

  const setOverlap = (open: boolean) => {
    write((prev) => ({
      ...prev,
      overlap: open
        ? {
            file: "app/header.tsx",
            left: "検証：小さいロゴ＋メニュー",
            right: "プレビュー：ログインボタンを右上に",
          }
        : null,
    }));
  };

  const resolveOverlap = (
    previewId: string,
    mode: "ai" | "mine" | "theirs"
  ) => {
    write((prev) => ({
      ...prev,
      overlap: null,
      previews: prev.previews.map((item) =>
        item.id === previewId ? { ...item, conflict: false } : item
      ),
    }));
    if (mode === "ai") {
      toast("両方を活かしてまとめました");
    }
  };

  const promote = (previewId: string, lane: EnvLane) => {
    write((prev) => {
      if (lane === "review") {
        const preview = prev.previews.find((item) => item.id === previewId);
        if (preview?.conflict) {
          return {
            ...prev,
            overlap: {
              file: "app/header.tsx",
              left: "検証：小さいロゴ＋メニュー",
              right: "プレビュー：ログインボタンを右上に",
            },
          };
        }
        const staging = prev.staging + 1;
        return {
          ...prev,
          dirty: false,
          history: [
            {
              current: true,
              id: `h_st_${Date.now()}`,
              meta: "検証に反映 · staging.adhd.gawarago.com",
              title: `v${staging} · ${preview?.title ?? "プレビュー"}`,
              when: "今",
              where: "review" as const,
            },
            ...prev.history.map((point) => ({ ...point, current: false })),
          ],
          previews: prev.previews.map((item) =>
            item.id === previewId
              ? { ...item, kind: "draft", state: "検証済み" }
              : item
          ),
          staging,
          toast: `検証を v${staging} にしました`,
        };
      }
      if (lane === "live") {
        return {
          ...prev,
          deployFailed: false,
          prod: prev.staging,
          prodHistory: [
            {
              label: `v${prev.staging} タスク管理アプリ`,
              when: "今",
            },
            ...prev.prodHistory,
          ],
          toast: `本番を v${prev.staging} にしました · adhd.gawarago.com`,
        };
      }
      return prev;
    });
  };

  const failPromote = () => {
    write((prev) => ({ ...prev, deployFailed: true, overlap: null }));
  };

  const rollbackProd = () => {
    write((prev) => {
      if (prev.prodHistory.length < 2) {
        return prev;
      }
      const [, previous] = prev.prodHistory;
      const match = /v(?<version>\d+)/u.exec(previous?.label ?? "");
      const version = match?.groups?.version
        ? Number(match.groups.version)
        : prev.prod - 1;
      return {
        ...prev,
        prod: version,
        prodHistory: [
          {
            label: `${previous?.label ?? `v${version}`}（戻した）`,
            when: "今",
          },
          ...prev.prodHistory,
        ],
        toast: `本番を v${version} に戻しました`,
      };
    });
  };

  const addSecret = (key: string, value: string, lane: EnvLane) => {
    write((prev) => ({
      ...prev,
      secrets: [...prev.secrets, { key, lane, value }],
    }));
  };

  const clearBanner = () => {
    write((prev) => ({ ...prev, banner: null }));
  };

  const dismissSummary = () => {
    write((prev) => ({ ...prev, returnSummary: false }));
  };

  const nameSavepoint = (title: string) => {
    write((prev) => ({
      ...prev,
      history: prev.history.map((point, index) =>
        index === 0 ? { ...point, title } : point
      ),
      toast: `保存ポイント「${title}」`,
    }));
  };

  const revertHistory = (id: string) => {
    write((prev) => ({
      ...prev,
      dirty: false,
      history: prev.history.map((point) => ({
        ...point,
        current: point.id === id,
      })),
      toast: "戻しました",
    }));
  };

  const runTerm = (raw: string) => {
    const command = raw.trim();
    if (command.length === 0) {
      return;
    }
    if (command === "clear") {
      write((prev) => ({ ...prev, terminal: [] }));
      return;
    }
    const extra: AppState["terminal"] = [
      { text: `$ ${command}`, tone: "plain" },
    ];
    if (command.startsWith("git ")) {
      extra.push({
        text: "ヒント: ここでは git は不要です。保存ポイント・反映は上のボタンから。",
        tone: "hint",
      });
    } else if (command === "ls") {
      extra.push({
        text: "app  convex  node_modules  package.json  pnpm-lock.yaml  tsconfig.json",
        tone: "ok",
      });
    } else if (command === "pwd") {
      extra.push({ text: "/workspace/task-board", tone: "ok" });
    } else {
      extra.push({
        text: `${command.split(" ")[0]}: この環境にはありません（会話で「${command} を実行して」と頼めます）`,
        tone: "err",
      });
    }
    write((prev) => ({ ...prev, terminal: [...prev.terminal, ...extra] }));
  };

  const askSide = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }
    write((prev) => ({
      ...prev,
      sideMessages: [
        ...prev.sideMessages,
        { body: trimmed, id: `su_${Date.now()}`, kind: "user" },
        {
          action: "スマホ幅で崩れていないか一通り確認して直して",
          body: "検証は本番に出す前に確かめる場所、本番はみんなが見る場所です。検証へ送っても本番は変わりません。",
          id: `sa_${Date.now()}`,
          kind: "ai",
        },
      ],
    }));
  };

  const createPreview = (projectId: string, name: string): string => {
    const slug = slugOf(name);
    const id = `p${Date.now()}`;
    write((prev) => ({
      ...prev,
      dirty: false,
      messages: {
        ...prev.messages,
        [projectId]: [
          {
            body: `プレビュー「${name}」を検証 v${prev.staging} の状態から作りました。何をしますか？`,
            id: `m_np_${Date.now()}`,
            kind: "ai",
          },
        ],
      },
      previews: [
        {
          conflict: false,
          id,
          kind: "draft",
          projectId,
          savepoints: [],
          slug,
          state: "作業中",
          title: name,
          url: previewUrl(slug),
        },
        ...prev.previews,
      ],
      toast: "プレビューを作りました",
    }));
    return id;
  };

  const loadDemo = () => {
    const packed = initialState();
    write({
      ...packed,
      connections: {
        cloudflare: {
          identity: serviceMeta("cloudflare"),
          status: "connected",
        },
        convex: { identity: serviceMeta("convex"), status: "connected" },
        github: { identity: serviceMeta("github"), status: "connected" },
        openai: { identity: serviceMeta("openai"), status: "connected" },
      },
      session: { email: "michito@gmail.com", name: "MS" },
    });
  };

  return {
    addSecret,
    advanceCreate,
    allConnected: allConnected(state.connections),
    answerQuestion,
    appendMessage,
    askQuestion,
    askSide,
    cancelConnect,
    clearBanner,
    connectService,
    connectedCount: connectedCount(state.connections),
    createPreview,
    createProject,
    disconnectService,
    dismissSummary,
    failPromote,
    finishConnect,
    hydrated,
    loadDemo,
    nameSavepoint,
    promote,
    reservePrompt,
    resolveApproval,
    resolveLimit,
    resolveOverlap,
    resolveSecret,
    revertHistory,
    rollbackProd,
    runTerm,
    sendTalk,
    setOverlap,
    signIn,
    signOut,
    state,
    stopTalk,
    toast,
    write,
  };
};
