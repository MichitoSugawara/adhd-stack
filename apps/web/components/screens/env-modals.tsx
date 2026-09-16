"use client";

import type { ReactNode } from "react";

import {
  ENV_LABEL,
  PREVIEW_FROM_UNAVAILABLE,
  PREVIEW_UNAVAILABLE,
  PROMOTE_UNAVAILABLE,
  STAGING_UNAVAILABLE,
} from "@/lib/env-labels";

const Overlay = ({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) => (
  <div className="bg-page/70 fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center">
    <div className="rounded-window bg-surface shadow-overlay w-full max-w-md p-5">
      <h2 className="text-[18px] font-semibold">{title}</h2>
      {children}
    </div>
  </div>
);

const Choice = ({
  disabled = true,
  label,
  note,
}: {
  disabled?: boolean;
  label: string;
  note: string;
}) => (
  <label className="rounded-card bg-inset flex items-start gap-3 p-3">
    <input
      className="mt-1"
      disabled={disabled}
      name="env-choice"
      type="radio"
    />
    <span>
      <span className="block text-[13px] font-medium">{label}</span>
      <span className="text-ink-3 mt-1 block text-[12px]">{note}</span>
    </span>
  </label>
);

export const NewPreviewModal = ({ onClose }: { onClose: () => void }) => (
  <Overlay title="新しいプレビュー">
    <p className="text-ink-2 mt-2 text-[13px] leading-6">
      {PREVIEW_UNAVAILABLE}
    </p>
    <div className="mt-4 flex flex-col gap-2">
      <Choice
        label={`${ENV_LABEL.staging}版から`}
        note="検証用のページはまだありません。"
      />
      <Choice
        label={`${ENV_LABEL.production}版から`}
        note="本番から枝を分ける操作はまだありません。"
      />
      <Choice
        label="既存のプレビューから"
        note="プレビュー一覧はまだ空です。"
      />
    </div>
    <p className="text-ink-3 mt-3 text-[12px]">{PREVIEW_FROM_UNAVAILABLE}</p>
    <div className="mt-5 flex justify-end">
      <button
        className="rounded-control bg-field text-ink h-9 px-3 text-[13px] font-medium"
        onClick={onClose}
        type="button"
      >
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
  <Overlay title={`${ENV_LABEL.staging} → ${ENV_LABEL.production}`}>
    <p className="text-ink-2 mt-2 text-[13px] leading-6">
      {canPromote
        ? "検証の内容を本番に出します。終わったことにはしません。"
        : PROMOTE_UNAVAILABLE}
    </p>
    <p className="text-ink-3 mt-3 text-[13px]">
      {changeNote ?? STAGING_UNAVAILABLE}
    </p>
    <div className="mt-5 flex justify-end gap-2">
      <button
        className="rounded-control text-ink-2 hover:bg-hover h-9 px-3 text-[13px]"
        onClick={onClose}
        type="button"
      >
        やめる
      </button>
      <button
        className="btn-accent rounded-control h-9 px-3 text-[13px] font-medium disabled:opacity-40"
        disabled={!canPromote}
        onClick={onConfirm}
        type="button"
      >
        本番へ反映
      </button>
    </div>
  </Overlay>
);
