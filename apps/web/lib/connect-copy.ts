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

export const nextLabel = (allConnected: boolean, hasLast: boolean): string => {
  if (allConnected && hasLast) {
    return "アプリに戻る";
  }
  if (allConnected) {
    return "一覧へ";
  }
  return "あとで";
};

export const nextHint = (
  allConnected: boolean,
  last?: { name: string; slug: string } | null
): string => {
  if (allConnected && last) {
    return `${last.name || last.slug} へ戻ります。`;
  }
  if (allConnected) {
    return "4つそろいました。";
  }
  return "途中でやめても、接続は残ります。";
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
