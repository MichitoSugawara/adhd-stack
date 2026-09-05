"use client";

import type { Overlap } from "../lib/mock-types";

interface OverlapDialogProperties {
  onClose: () => void;
  overlap: Overlap | null;
}

export const OverlapDialog = ({
  onClose,
  overlap,
}: OverlapDialogProperties) => {
  if (!overlap) {
    return null;
  }
  return (
    <div className="dialog-back">
      <div className="dialog">
        <h2>重なり</h2>
        <p className="lede">{overlap.file}</p>
        <p>こちら: {overlap.left}</p>
        <p>あちら: {overlap.right}</p>
        <button className="btn btn-solid" onClick={onClose} type="button">
          閉じる
        </button>
      </div>
    </div>
  );
};
