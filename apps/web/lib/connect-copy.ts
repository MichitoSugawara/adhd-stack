import type { ServiceId } from "@/lib/services";
import { SERVICES } from "@/lib/services";

export const ctaLabelFor = (
  boardReady: boolean,
  busy: ServiceId | null,
  id: ServiceId,
  waitingDevice: boolean
): string => {
  if (!boardReady) {
    return "確認中…";
  }
  if (id === "chatgpt" && waitingDevice) {
    return "入力待ち";
  }
  if (busy === id) {
    return "認可待ち";
  }
  return "つなぐ";
};

export const firstCreateWelcome = "つぎは最初のアプリ名を決める。";

export const nextLabel = (
  allConnected: boolean,
  resumeWorkspace: boolean
): string => {
  if (allConnected && resumeWorkspace) {
    return "アプリに戻る";
  }
  return "アプリを作成";
};

export const nextHint = (
  allConnected: boolean,
  last?: { name: string; slug: string } | null
): string => {
  if (allConnected && last) {
    return `${last.name || last.slug} の続きに戻れます。`;
  }
  if (allConnected) {
    return firstCreateWelcome;
  }
  return "4つの接続がそろうと、アプリを作成できます。";
};

export const boardChip = (allConnected: boolean): string =>
  allConnected ? "そろいました" : "まだそろっていません";

export const nextDisconnected = (
  connections:
    | readonly {
        provider: string;
        status: string;
      }[]
    | undefined
): (typeof SERVICES)[number] | null => {
  const byProvider = new Map(
    (connections ?? []).map((item) => [item.provider, item.status])
  );
  for (const service of SERVICES) {
    if (byProvider.get(service.id) !== "connected") {
      return service;
    }
  }
  return null;
};
