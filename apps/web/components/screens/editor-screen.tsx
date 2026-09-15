"use client";

import Link from "next/link";

import PromptBar from "@/components/primitives/PromptBar";
import StreamingText from "@/components/primitives/StreamingText";
import ThinkingState from "@/components/primitives/ThinkingState";
import ToolChips from "@/components/primitives/ToolChips";
import { AppFrame } from "@/components/shell/app-frame";
import { ShellGate } from "@/components/shell/shell-gate";
import { useShell } from "@/lib/shell-state";

export const EditorScreen = ({ appId }: { appId: string }) => {
  const shell = useShell();
  const app = shell.state.apps.find((item) => item.id === appId);
  const messages = shell.state.messages[appId] ?? [];

  const send = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }
    shell.appendMessage(appId, { body: trimmed, kind: "user" });
    shell.appendMessage(appId, {
      body: "シェルの思考表示",
      kind: "thinking",
    });
    shell.appendMessage(appId, {
      body: "シェルのツール表示",
      kind: "tools",
    });
    shell.appendMessage(appId, {
      body: "Phase 3 で CodingBackend がここに繋がります。いまは見た目の確認です。ファイルも公開先も変わっていません。",
      kind: "ai",
    });
  };

  return (
    <ShellGate>
      <AppFrame>
        {shell.hydrated && !app ? (
          <main className="px-8 py-10">
            <h1 className="text-[24px] font-semibold">
              アプリが見つかりません
            </h1>
          </main>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <header className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
              <div>
                <p className="text-ink-3 text-[12px]">チャット</p>
                <h1 className="text-[16px] font-semibold">
                  {app?.name ?? appId}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  className="rounded-control text-ink-2 hover:bg-hover flex h-8 items-center px-3 text-[13px]"
                  href={`/p/${appId}/envs`}
                >
                  環境
                </Link>
                <button
                  className="rounded-control bg-field text-ink-3 h-8 px-3 text-[13px] font-medium"
                  disabled
                  title="Phase 4 でユーザーの Pages と Convex に出します"
                  type="button"
                >
                  公開（Phase 4）
                </button>
              </div>
            </header>
            <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
              <div className="mx-auto flex max-w-2xl flex-col gap-5">
                <p className="shell-note">
                  PromptBar / Thinking / ToolChips / Streaming は Beautiful UI
                  です。返答はローカルのシェル確認で、コードは書き換わりません。
                </p>
                {messages.length === 0 ? (
                  <p className="text-ink-2 text-[14px]">
                    最初の指示を書いてください。公開 URL はまだ返しません。
                  </p>
                ) : null}
                {messages.map((message) => {
                  if (message.kind === "user") {
                    return (
                      <div
                        className="rounded-card bg-inset ml-auto max-w-[80%] px-3 py-2 text-[14px]"
                        key={message.id}
                      >
                        {message.body}
                      </div>
                    );
                  }
                  if (message.kind === "thinking") {
                    return (
                      <ThinkingState
                        active="考えています"
                        done="シェル確認の思考"
                        key={message.id}
                        rows={[
                          { primary: "指示を読む" },
                          {
                            primary: "CodingBackend はまだつながっていない",
                          },
                        ]}
                        variant="Steps"
                      />
                    );
                  }
                  if (message.kind === "tools") {
                    return (
                      <ToolChips
                        diffs={[]}
                        key={message.id}
                        labels={{ header: "ツール（見た目）", more: "" }}
                        steps={[
                          {
                            chip: "未接続",
                            detail: [
                              {
                                text: "Phase 3 で本物のツール呼び出しになります。",
                              },
                            ],
                            detailMono: false,
                            icon: "think",
                            label: "準備",
                            mono: false,
                          },
                        ]}
                      />
                    );
                  }
                  return (
                    <StreamingText
                      content={[{ text: message.body }]}
                      followUps={[]}
                      key={message.id}
                      labels={{ followUps: "", sources: "" }}
                      loop={false}
                      sources={[]}
                    />
                  );
                })}
              </div>
            </div>
            <div className="border-line border-t px-5 py-3">
              <div className="mx-auto max-w-2xl">
                <PromptBar
                  demo={false}
                  onSend={send}
                  placeholder="指示を書く。まだコードは変わりません"
                />
              </div>
            </div>
          </div>
        )}
      </AppFrame>
    </ShellGate>
  );
};
