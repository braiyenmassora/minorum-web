"use client";

import { Square, Volume2 } from "lucide-react";
import { useSyncExternalStore } from "react";

import { CopyIconButton } from "@/components/chat/copy-icon-button";
import {
  getActiveMessageSpeechId,
  subscribeMessageSpeech,
  toggleMessageSpeech,
} from "@/lib/utils/message-speech";
import { cn } from "@/lib/utils";

type ChatMessageActionsProps = {
  messageId: string;
  text: string;
};

export function ChatMessageActions({
  messageId,
  text,
}: ChatMessageActionsProps) {
  const activeMessageId = useSyncExternalStore(
    subscribeMessageSpeech,
    getActiveMessageSpeechId,
    () => null,
  );
  const isPlaying = activeMessageId === messageId;

  return (
    <div className="mt-3 flex items-center gap-stack-sm">
      <CopyIconButton text={text} label="Copy message" />
      <button
        type="button"
        onClick={() => {
          void toggleMessageSpeech(messageId, text);
        }}
        aria-label={isPlaying ? "Stop reading message" : "Read message aloud"}
        aria-pressed={isPlaying}
        className={cn(
          "inline-flex size-control-xs items-center justify-center rounded-token-sm transition-colors",
          isPlaying
            ? "bg-surface-raised text-text-primary"
            : "text-text-muted hover:bg-surface-raised hover:text-text-primary",
        )}
      >
        {isPlaying ? (
          <Square className="size-3 fill-current" aria-hidden />
        ) : (
          <Volume2 className="size-3.5" aria-hidden />
        )}
      </button>
    </div>
  );
}
