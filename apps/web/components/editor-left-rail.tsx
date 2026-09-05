"use client";

import Link from "next/link";

import type { Preview } from "../lib/mock-types";

interface EditorLeftRailProperties {
  previewId: string | undefined;
  previews: Preview[];
  projectId: string;
}

export const EditorLeftRail = ({
  previewId,
  previews,
  projectId,
}: EditorLeftRailProperties) => {
  const drafts: Preview[] = [];
  let live: Preview | undefined;
  let review: Preview | undefined;
  for (const item of previews) {
    if (item.kind === "live") {
      live = item;
    } else if (item.kind === "review") {
      review = item;
    } else {
      drafts.push(item);
    }
  }

  return (
    <aside className="editor-side">
      <p className="kicker">面</p>
      {live ? (
        <Link
          className={`side-link ${previewId === live.id ? "is-on" : ""}`}
          href={`/p/${projectId}?preview=${live.id}&tab=browser`}
        >
          本番
          <small>{live.url}</small>
        </Link>
      ) : (
        <p className="lede">本番はまだありません。</p>
      )}
      {review ? (
        <Link
          className={`side-link ${previewId === review.id ? "is-on" : ""}`}
          href={`/p/${projectId}?preview=${review.id}&tab=browser`}
        >
          検証版
          <small>{review.url}</small>
        </Link>
      ) : (
        <p className="lede">検証版はまだありません。</p>
      )}
      <p className="kicker">プレビュー</p>
      {drafts.map((item) => (
        <Link
          className={`side-link ${previewId === item.id ? "is-on" : ""}`}
          href={`/p/${projectId}?preview=${item.id}&tab=browser`}
          key={item.id}
        >
          {item.title}
          <small>{item.url}</small>
        </Link>
      ))}
      <Link className="btn btn-ghost" href={`/p/${projectId}/envs`}>
        環境を見る
      </Link>
    </aside>
  );
};
