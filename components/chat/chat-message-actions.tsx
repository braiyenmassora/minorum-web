"use client";

import { Volume2 } from "lucide-react";

import { CopyIconButton } from "@/components/chat/copy-icon-button";

type ChatMessageActionsProps = {
  text: string;
};

export function ChatMessageActions({ text }: ChatMessageActionsProps) {
  function handleRead() {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="mt-2 flex items-center gap-1.5">
      <CopyIconButton text={text} label="Salin pesan" />
      <button
        type="button"
        onClick={handleRead}
        aria-label="Baca pesan"
        className="inline-flex size-7 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
      >
        <Volume2 className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
