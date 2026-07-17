"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type CopyIconButtonProps = {
  text: string;
  className?: string;
  label?: string;
};

export function CopyIconButton({
  text,
  className,
  label = "Salin",
}: CopyIconButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary",
        className,
      )}
    >
      {copied ? (
        <Check className="size-3.5" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Disalin" : ""}
      </span>
    </button>
  );
}
