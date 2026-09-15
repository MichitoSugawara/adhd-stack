import { publicHttpUrl } from "@/lib/public-url";
import { CONVEX_FUNCTION_PUSH_NOTE } from "@/lib/publish-copy";

const UrlRow = ({ href, label }: { href: string | null; label: string }) => (
  <p className="text-[13px] leading-6">
    <span className="text-ink-3">{label}</span>
    {href ? (
      <a
        className="text-ink ml-2 break-all underline underline-offset-2"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {href}
      </a>
    ) : (
      <span className="text-ink-2 ml-2">まだありません</span>
    )}
  </p>
);

export const PublishPanel = ({
  convexUrl,
  error,
  hint,
  notes,
  onPublish,
  pagesUrl,
  pending,
}: {
  convexUrl?: string | null;
  error?: string | null;
  hint?: string | null;
  notes?: readonly string[];
  onPublish: () => void;
  pagesUrl?: string | null;
  pending: boolean;
}) => {
  const pages = publicHttpUrl(pagesUrl);
  const convex = publicHttpUrl(convexUrl);
  const shownNotes = notes ?? [];
  const showFunctionGap =
    convex !== null &&
    !shownNotes.some((note) => note.includes("関数のプッシュ"));

  return (
    <section className="rounded-card bg-surface shadow-card max-w-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-ink-3 text-[12px]">公開</p>
          <p className="text-ink-2 mt-1 text-[13px] leading-6">
            開いているアプリを、つながっている Cloudflare Pages と Convex
            に出します。偽の URL は出しません。
          </p>
        </div>
        <button
          className="rounded-control bg-ink text-surface h-8 shrink-0 px-3 text-[13px] font-medium disabled:opacity-40"
          disabled={pending}
          onClick={onPublish}
          type="button"
        >
          {pending ? "公開しています…" : "公開する"}
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-1">
        <UrlRow href={pages} label="Pages" />
        <UrlRow href={convex} label="Convex" />
      </div>
      {hint ? <p className="text-ink-2 mt-3 text-[13px]">{hint}</p> : null}
      {showFunctionGap ? (
        <p className="text-ink-2 mt-3 text-[13px]">
          {CONVEX_FUNCTION_PUSH_NOTE}
        </p>
      ) : null}
      {shownNotes.map((note) => (
        <p className="text-ink-2 mt-2 text-[13px]" key={note}>
          {note}
        </p>
      ))}
      {error ? <p className="text-red mt-3 text-[13px]">{error}</p> : null}
    </section>
  );
};
