"use client";

interface ChatgptDevicePanelProperties {
  busy: boolean;
  onCancel: () => void;
  userCode: string;
  verificationUrl: string;
}

export const ChatgptDevicePanel = ({
  busy,
  onCancel,
  userCode,
  verificationUrl,
}: ChatgptDevicePanelProperties) => (
  <div className="rounded-card bg-field mt-4 p-3">
    <p className="text-ink-3 text-[12px] font-medium tracking-[0.08em] uppercase">
      入力コード
    </p>
    <p className="mt-2 font-mono text-[28px] leading-none tracking-[0.12em]">
      {userCode}
    </p>
    <p className="text-ink-2 mt-3 text-[13px] leading-5">
      開いたページに、このコードを入力してください。ログインのあとコード欄が空になることがあります。画面のコードが正です。
    </p>
    <a
      className="text-accent-ink mt-3 inline-flex text-[13px] font-medium underline-offset-2 hover:underline"
      href={verificationUrl}
      rel="noreferrer"
      target="_blank"
    >
      入力ページを開く
    </a>
    <p className="text-ink-3 mt-2 text-[12px]">
      {busy ? "確認しています…" : "認可を待っています"}
    </p>
    <button
      className="rounded-control text-ink-2 hover:bg-hover mt-3 h-8 px-3 text-[13px]"
      onClick={onCancel}
      type="button"
    >
      やめる
    </button>
  </div>
);
