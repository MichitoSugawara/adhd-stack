export const previewUrl = (slug: string): string =>
  `https://${slug}.preview.adhd.gawarago.com`;

export const previewTagClass = (state: string): string => {
  if (state === "要確認") {
    return "tag tag-accent-2";
  }
  if (state === "作業中" || state === "反映済み" || state === "公開中") {
    return "tag tag-accent";
  }
  return "tag tag-neutral";
};

export const usageBarColor = (usage: number): string => {
  if (usage >= 100) {
    return "var(--color-accent-2)";
  }
  if (usage >= 80) {
    return "var(--color-accent-2-500)";
  }
  return "var(--color-accent)";
};

export const connectTagClass = (
  on: boolean,
  failed: boolean
): "tag tag-accent" | "tag tag-accent-2" => {
  if (on || !failed) {
    return "tag tag-accent";
  }
  return "tag tag-accent-2";
};

export const connectTagText = (
  on: boolean,
  busy: boolean,
  failed: boolean
): string => {
  if (on) {
    return "接続済み";
  }
  if (busy) {
    return "接続中…";
  }
  if (failed) {
    return "失敗";
  }
  return "未接続";
};

export const paneTitle = (tab: string): string => {
  if (tab === "browser") {
    return "ブラウザ";
  }
  if (tab === "source") {
    return "ソース";
  }
  if (tab === "changes") {
    return "変更";
  }
  if (tab === "history") {
    return "履歴";
  }
  return "相談";
};

export const paneSub = (tab: string): string => {
  if (tab === "history") {
    return "● 本番 · ● 検証 · ● このプレビュー";
  }
  if (tab === "consult") {
    return "コードは変えない";
  }
  return "";
};

export const historyDot = (where: "live" | "preview" | "review"): string => {
  if (where === "live") {
    return "var(--color-text)";
  }
  if (where === "review") {
    return "var(--color-neutral-500)";
  }
  return "var(--color-accent)";
};

export const connectLead = (
  ready: boolean,
  failed: boolean,
  count: number,
  failedName: string
): string => {
  if (failed) {
    return `${failedName} がつながりませんでした。ほかはそのままです。`;
  }
  if (ready) {
    return "考えることは、もうありません。";
  }
  return `あと${4 - count}つ。それぞれ数十秒で終わります。`;
};

export const nextKicker = (ready: boolean, failed: boolean): string => {
  if (failed) {
    return "うまくいかないとき";
  }
  if (ready) {
    return "準備完了";
  }
  return "次のステップ";
};

export const nextTitle = (
  ready: boolean,
  failed: boolean,
  failedName: string,
  missingName: string
): string => {
  if (failed) {
    return `${failedName} 側で認可を拒否`;
  }
  if (ready) {
    return "プロジェクトへ";
  }
  return `${missingName} をつなぐ`;
};

export const nextBody = (
  ready: boolean,
  failed: boolean,
  missingBody: string
): string => {
  if (failed) {
    return "チームの管理者権限がないと拒否されることがあります。個人チームを選ぶか、管理者に依頼してください。";
  }
  if (ready) {
    return "最初のプロジェクトを作りましょう。名前を決めるだけです。";
  }
  return `${missingBody}。`;
};

export const connectHeading = (
  count: number,
  ready: boolean,
  banner: boolean
): string => {
  if (banner) {
    return "接続";
  }
  if (ready) {
    return "4つそろいました。";
  }
  if (count === 0) {
    return "ようこそ。まず4つをつなぎます。";
  }
  return "接続";
};

export const connectIdentity = (
  on: boolean,
  busy: boolean,
  identity: string
): string => {
  if (on) {
    return identity;
  }
  if (busy) {
    return "アカウントを選択中";
  }
  return "";
};

export const composerPlaceholder = (
  busy: boolean,
  waiting: boolean
): string => {
  if (busy) {
    return "作業中… 止めるには ■";
  }
  if (waiting) {
    return "または、ここに書く…";
  }
  return "続きを話す…";
};

export const stepMark = (done: boolean, now: boolean): string => {
  if (done) {
    return "✓";
  }
  if (now) {
    return "●";
  }
  return "○";
};

export const stepClass = (done: boolean, now: boolean): string | undefined => {
  if (done) {
    return "is-done";
  }
  if (now) {
    return "is-now";
  }
  return undefined;
};

export const slugOf = (name: string): string => {
  const ascii = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");
  return ascii.length > 0 ? ascii.slice(0, 24) : `p-${Date.now()}`;
};
