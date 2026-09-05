"use client";

import type { Overlap } from "../lib/mock-types";

interface OverlapDialogProperties {
  onClose: () => void;
  onPick: (mode: "ai" | "mine" | "theirs") => void;
  overlap: Overlap | null;
}

export const OverlapDialog = ({
  onClose,
  onPick,
  overlap,
}: OverlapDialogProperties) => {
  if (!overlap) {
    return null;
  }
  return (
    <div className="dialog-back">
      <div className="dialog dialog-wide">
        <span className="kicker" style={{ color: "var(--color-accent-2-700)" }}>
          重なり
        </span>
        <h2 className="dialog-title">同じ場所を変えています</h2>
        <p className="lede">{overlap.file}</p>
        <div className="overlap-grid">
          <div className="card">
            <span className="card-kicker">検証にあるもの</span>
            <pre>{overlap.left}</pre>
          </div>
          <div className="card">
            <span className="card-kicker">あなたのプレビュー</span>
            <pre>{overlap.right}</pre>
          </div>
        </div>
        <div className="dialog-actions" style={{ flexDirection: "column" }}>
          <button
            className="btn btn-primary btn-block"
            onClick={() => onPick("ai")}
            type="button"
          >
            AI に両方を活かしてまとめてもらう（おすすめ）
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => onPick("mine")}
            type="button"
          >
            自分の変更を優先
          </button>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => onPick("theirs")}
            type="button"
          >
            検証にあるものを優先
          </button>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            やめる
          </button>
        </div>
      </div>
    </div>
  );
};
