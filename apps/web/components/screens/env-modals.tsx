"use client";

import type { ReactNode } from "react";

import { DisabledAction } from "@/components/screens/env-card";
import {
  ENV_LABEL,
  PREVIEW_FROM_UNAVAILABLE,
  PREVIEW_UNAVAILABLE,
  PROMOTE_UNAVAILABLE,
  STAGING_UNAVAILABLE,
} from "@/lib/env-labels";
import { hostOf } from "@/lib/public-url";

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

export const NewPreviewModal = ({
  existingPreviewUrl,
  onClose,
  productionUrl,
}: {
  existingPreviewUrl?: string | null;
  onClose: () => void;
  productionUrl?: string | null;
}) => (
  <Overlay title="新しいプレビュー">
    <p className="text-ink-2 mt-2 text-[13px] leading-6">
      {PREVIEW_UNAVAILABLE}
    </p>
    <label className="mt-4 block">
      <span className="text-ink-3 text-[12px]">名前</span>
      <input
        className="rounded-control bg-field text-ink-3 shadow-inset-field mt-1 h-10 w-full px-3 text-[14px]"
        disabled
        placeholder="名前と URL はまだ切れません"
      />
    </label>
    <p className="text-ink-3 mt-4 text-[12px]">どこから始めるか</p>
    <div className="mt-2 flex flex-col gap-2">
      <Choice
        label={`${ENV_LABEL.staging}の状態から`}
        note="検証用のページはまだありません。"
      />
      <Choice
        label={`${ENV_LABEL.production}から`}
        note={
          productionUrl
            ? `${hostOf(productionUrl)} から新しいプレビューを切る操作はまだありません。`
            : "本番から新しいプレビューを作る操作はまだありません。"
        }
      />
      <Choice
        label="既存のプレビューの続きから"
        note={
          existingPreviewUrl
            ? `${hostOf(existingPreviewUrl)} はありますが、そこから新しいプレビューはまだ切れません。`
            : "プレビュー一覧はまだ空です。"
        }
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
  <Overlay title="本番へ反映しますか？">
    <p className="text-ink-3 mt-1 text-[12px]">
      {ENV_LABEL.staging} → {ENV_LABEL.production}
    </p>
    <p className="text-ink-2 mt-2 text-[13px] leading-6">
      {canPromote
        ? "検証の内容を本番に出します。終わったことにはしません。"
        : PROMOTE_UNAVAILABLE}
    </p>
    <div className="rounded-card bg-inset mt-4 p-3">
      <p className="text-ink-3 text-[12px]">含まれる変更</p>
      <p className="text-ink-2 mt-1 text-[13px]">
        {changeNote ?? STAGING_UNAVAILABLE}
      </p>
    </div>
    <div className="mt-5 flex justify-end gap-2">
      <button
        className="rounded-control text-ink-2 hover:bg-hover h-9 px-3 text-[13px]"
        onClick={onClose}
        type="button"
      >
        やめる
      </button>
      <DisabledAction>差を見る</DisabledAction>
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
