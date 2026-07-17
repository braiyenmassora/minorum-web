"use client";

import { ComposerPreviewShell } from "@/components/chat/composer-preview-shell";
import { getAppCopy } from "@/lib/core/copy/app-copy";
import { cn } from "@/lib/utils";

type PastedTextPreviewProps = {
  text: string;
  expanded?: boolean;
  onToggleExpand?: () => void;
  onRemove?: () => void;
  /** bubble = sent message; composer = input area chip */
  layout?: "bubble" | "composer";
};

function PastedBadge({
  compact,
  onUserBubble,
}: {
  compact?: boolean;
  onUserBubble?: boolean;
}) {
  const label = getAppCopy().chat_bubble.pasted;
  return (
    <span
      className={cn(
        "rounded-token-sm border font-semibold tracking-[0.04em] uppercase",
        onUserBubble
          ? "border-white/15 text-text-on-user"
          : "border-border-subtle text-text-primary",
        compact ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]",
      )}
    >
      {label}
    </span>
  );
}

export function PastedTextPreview({
  text,
  expanded = false,
  onToggleExpand,
  onRemove,
  layout = "bubble",
}: PastedTextPreviewProps) {
  const label = getAppCopy().chat_bubble.pasted;
  const isComposer = layout === "composer";
  const expandShell = Boolean(onToggleExpand && !expanded);

  const shellClass = cn(
    "flex min-w-0 flex-col text-left",
    isComposer
      ? "size-[var(--chat-attachment-preview)] justify-between gap-1 rounded-token border border-border-subtle bg-surface px-1.5 py-1.5"
      : expanded
        ? "max-w-[min(100%,20rem)] gap-2.5 rounded-token border border-white/10 bg-user-bubble px-3 py-2.5"
        : "size-[var(--chat-image-bubble)] justify-between gap-1.5 rounded-token border border-white/10 bg-user-bubble px-2 py-2",
    expandShell && "cursor-pointer transition-opacity hover:opacity-90",
  );

  const body = (
    <>
      <p
        className={cn(
          "break-words whitespace-pre-wrap",
          isComposer
            ? "line-clamp-3 flex-1 text-[10px] leading-tight text-text-secondary"
            : expanded
              ? "text-token-body leading-[1.55] text-white/75"
              : "line-clamp-6 flex-1 text-[11px] leading-snug text-white/75",
        )}
      >
        {text}
      </p>
      {onToggleExpand && expanded ? (
        <button
          type="button"
          className="self-start rounded-token-sm border border-white/15 px-2 py-0.5 text-[11px] font-semibold tracking-[0.04em] text-text-on-user uppercase transition-opacity hover:opacity-75"
          onClick={onToggleExpand}
          aria-expanded
          aria-label="Ciutkan teks"
        >
          {label}
        </button>
      ) : (
        <PastedBadge compact={isComposer} onUserBubble={!isComposer} />
      )}
    </>
  );

  const shell = expandShell ? (
    <button
      type="button"
      className={shellClass}
      onClick={onToggleExpand}
      aria-expanded={false}
      aria-label="Lihat teks lengkap"
    >
      {body}
    </button>
  ) : (
    <div className={shellClass}>{body}</div>
  );

  if (isComposer && onRemove) {
    return (
      <ComposerPreviewShell onRemove={onRemove} removeLabel="Hapus teks">
        {shell}
      </ComposerPreviewShell>
    );
  }

  return shell;
}
