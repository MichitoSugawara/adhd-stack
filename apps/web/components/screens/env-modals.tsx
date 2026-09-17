"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

import { WorkspaceIcon } from "@/components/shell/workspace-icon";

const Overlay = ({
  children,
  title,
  onClose,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
}) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
    };
  }, []);
  return (
    <dialog
      aria-labelledby="environment-dialog-title"
      className="studio-modal"
      onCancel={onClose}
      ref={ref}
    >
      <h2 id="environment-dialog-title">{title}</h2>
      {children}
    </dialog>
  );
};

export const NewPreviewModal = ({
  existingPreviewUrl,
  onClose,
  productionUrl,
}: {
  existingPreviewUrl?: string | null;
  onClose: () => void;
  productionUrl?: string | null;
}) => (
  <Overlay onClose={onClose} title="プレビューについて">
    <p>
      新しいプレビューを作成する機能は、まだ利用できません。既存の URL
      からアプリを確認できます。
    </p>
    <div className="studio-modal-actions">
      {(existingPreviewUrl ?? productionUrl) ? (
        <a
          className="ui-button"
          href={existingPreviewUrl ?? productionUrl ?? undefined}
          rel="noreferrer"
          target="_blank"
        >
          アプリを開く{" "}
          <WorkspaceIcon
            name="arrow"
            size={14}
            style={{ transform: "rotate(-45deg)" }}
          />
        </a>
      ) : null}
      <button className="ui-button-primary" onClick={onClose} type="button">
        閉じる
      </button>
    </div>
  </Overlay>
);

export const PromoteModal = ({
  canPromote,
  changeNote,
  onClose,
  onConfirm,
}: {
  canPromote: boolean;
  changeNote?: string;
  onClose: () => void;
  onConfirm?: () => void;
}) => (
  <Overlay
    onClose={onClose}
    title={canPromote ? "本番へ反映しますか？" : "検証環境について"}
  >
    <p>
      {canPromote
        ? "検証した内容を本番に反映します。完了まで、進捗を確認できます。"
        : "検証環境から本番へ反映する機能は、まだ利用できません。"}
    </p>
    {changeNote ? <p>{changeNote}</p> : null}
    <div className="studio-modal-actions">
      <button className="ui-button" onClick={onClose} type="button">
        {canPromote ? "キャンセル" : "閉じる"}
      </button>
      {canPromote ? (
        <button className="ui-button-primary" onClick={onConfirm} type="button">
          本番へ反映
        </button>
      ) : null}
    </div>
  </Overlay>
);
