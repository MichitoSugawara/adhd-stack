"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { clearAppIdeaDraft } from "@/lib/app-draft";
import { useDeleteApp } from "@/lib/coding-port";
import { connectErrorMessage } from "@/lib/connect-error";
import {
  DELETE_RESOURCE_LABELS,
  DELETE_STATUS_LABELS,
} from "@/lib/delete-app-copy";
import { clearLastWorkspaceIfSlug } from "@/lib/last-workspace";

interface DeleteResourceRow {
  kind: keyof typeof DELETE_RESOURCE_LABELS;
  message: string;
  reconnect: boolean;
  status: keyof typeof DELETE_STATUS_LABELS;
}

interface DeleteAppResult {
  complete: boolean;
  localDeleted: boolean;
  resources: DeleteResourceRow[];
}

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
      aria-labelledby="delete-app-dialog-title"
      className="studio-modal studio-modal-danger"
      onCancel={onClose}
      ref={ref}
    >
      <h2 id="delete-app-dialog-title">{title}</h2>
      {children}
    </dialog>
  );
};

export const DeleteAppDialog = ({
  name,
  slug,
  onClose,
}: {
  name: string;
  slug: string;
  onClose: () => void;
}) => {
  const router = useRouter();
  const deleteApp = useDeleteApp();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [failNote, setFailNote] = useState<string | null>(null);
  const [result, setResult] = useState<DeleteAppResult | null>(null);
  const matches = typed.trim() === name.trim();
  const confirmLabel = result ? "もう一度削除する" : "完全に削除する";

  const leaveIfRemoved = (payload: DeleteAppResult) => {
    if (!payload.localDeleted) {
      return;
    }
    clearAppIdeaDraft(slug);
    clearLastWorkspaceIfSlug(slug);
    if (payload.complete) {
      router.push("/projects");
    }
  };

  const handleClose = () => {
    if (result?.localDeleted) {
      router.push("/projects");
      return;
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!matches || busy) {
      return;
    }
    setBusy(true);
    setFailNote(null);
    try {
      const payload = await deleteApp({ confirmName: typed.trim(), slug });
      setResult(payload);
      leaveIfRemoved(payload);
    } catch (error) {
      setFailNote(connectErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={handleClose} title="このアプリを削除しますか？">
      <p>
        「{name}
        」と、つながっている保存先・公開先・実行環境をまとめて消します。元には戻せません。
      </p>
      {result ? (
        <ul className="studio-delete-results">
          {result.resources.map((row) => (
            <li data-status={row.status} key={row.kind}>
              <strong>{DELETE_RESOURCE_LABELS[row.kind]}</strong>
              <span>{DELETE_STATUS_LABELS[row.status]}</span>
              <p>{row.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <label className="studio-delete-confirm">
          続けるには、「{name}」と入力してください
          <input
            autoComplete="off"
            onChange={(event) => {
              setTyped(event.target.value);
            }}
            placeholder={name}
            spellCheck={false}
            value={typed}
          />
        </label>
      )}
      {failNote ? (
        <p className="studio-error" role="alert">
          {failNote}
        </p>
      ) : null}
      {result && !result.complete ? (
        <p className="studio-error" role="alert">
          一部を消せませんでした。残っているものを確認し、つなぎ直してからもう一度削除してください。
        </p>
      ) : null}
      <div className="studio-modal-actions">
        <button className="ui-button" onClick={handleClose} type="button">
          {result?.localDeleted ? "閉じる" : "キャンセル"}
        </button>
        {result?.complete ? null : (
          <button
            className="ui-button-danger"
            disabled={result ? busy : !matches || busy}
            onClick={() => {
              void handleDelete();
            }}
            type="button"
          >
            {busy ? "削除しています…" : confirmLabel}
          </button>
        )}
      </div>
    </Overlay>
  );
};

export const DeleteAppButton = ({
  name,
  slug,
  label = "アプリを削除",
  className = "ui-button-danger",
}: {
  name: string;
  slug: string;
  label?: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={className}
        onClick={() => {
          setOpen(true);
        }}
        type="button"
      >
        {label}
      </button>
      {open ? (
        <DeleteAppDialog
          name={name}
          onClose={() => {
            setOpen(false);
          }}
          slug={slug}
        />
      ) : null}
    </>
  );
};

export const DeleteAppZone = ({
  name,
  slug,
}: {
  name: string;
  slug: string;
}) => (
  <section className="studio-danger-zone">
    <div>
      <h2>アプリを削除</h2>
      <p>
        「{name}
        」と、つながっている保存先・公開先・実行環境を消します。元には戻せません。
      </p>
    </div>
    <DeleteAppButton name={name} slug={slug} />
  </section>
);
