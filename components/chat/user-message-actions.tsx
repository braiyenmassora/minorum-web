"use client";

import { RotateCcw } from "lucide-react";

import { CopyIconButton } from "@/components/chat/copy-icon-button";
import { getAppCopy } from "@/lib/core/copy/app-copy";
import { cn } from "@/lib/utils";

type UserMessageActionsProps = {
  text: string;
  disabled?: boolean;
  onRetry: () => void;
};

export function UserMessageActions({
  text,
  disabled = false,
  onRetry,
}: UserMessageActionsProps) {
  const copy = getAppCopy().chat_bubble;

  return (
    <div className="mt-1 flex items-center justify-end gap-1.5">
      {text.trim() ? <CopyIconButton text={text} label={copy.copy} /> : null}
      <button
        type="button"
        onClick={onRetry}
        disabled={disabled}
        aria-label={copy.retry}
        className={cn(
          "inline-flex size-7 items-center justify-center rounded-token-sm text-text-muted transition-colors",
          "hover:bg-surface-raised hover:text-text-primary disabled:pointer-events-none disabled:opacity-40",
        )}
      >
        <RotateCcw className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
