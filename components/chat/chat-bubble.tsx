"use client";

import { useState } from "react";

import { ChatImage } from "@/components/chat/chat-image";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { ChatMessageActions } from "@/components/chat/chat-message-actions";
import { UserMessageActions } from "@/components/chat/user-message-actions";
import { getAppCopy } from "@/lib/core/copy/app-copy";
import type { Message } from "@/lib/models/message";
import {
  getMessageImageUrls,
  getMessageText,
} from "@/lib/models/message-content";
import { cn } from "@/lib/utils";

const USER_TEXT_PREVIEW_CHARS = 500;

type ChatBubbleProps = {
  message: Message;
  actionsDisabled?: boolean;
  onRetryUser?: (messageId: string) => void;
};

function UserBubbleText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const copy = getAppCopy().chat_bubble;
  const truncatable = text.length > USER_TEXT_PREVIEW_CHARS;
  const shown =
    truncatable && !expanded
      ? `${text.slice(0, USER_TEXT_PREVIEW_CHARS)}…`
      : text;

  return (
    <div className="w-fit max-w-full min-w-0 rounded-token bg-user-bubble px-3 py-2 text-token-body leading-[1.5] text-white">
      <p className="break-words whitespace-pre-wrap">{shown}</p>
      {truncatable ? (
        <button
          type="button"
          className="mt-1 text-token-body-medium text-white/45 transition-colors hover:text-white/65"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? copy.show_less : copy.show_more}
        </button>
      ) : null}
    </div>
  );
}

export function ChatBubble({
  message,
  actionsDisabled = false,
  onRetryUser,
}: ChatBubbleProps) {
  const text = getMessageText(message.content);
  const imageUrls = getMessageImageUrls(message.content);
  const isUser = message.role === "user";

  if (!text && imageUrls.length === 0) {
    return null;
  }

  const imageRow = (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {imageUrls.map((url) => (
        <ChatImage key={url} src={url} size="bubble" />
      ))}
    </div>
  );

  if (isUser && !text) {
    return (
      <div className="flex w-full min-w-0 flex-col items-end gap-1">
        {imageRow}
        {onRetryUser ? (
          <UserMessageActions
            text=""
            disabled={actionsDisabled}
            onRetry={() => onRetryUser(message.id)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-2",
        isUser ? "items-end" : "items-start",
      )}
    >
      {imageUrls.length > 0 ? imageRow : null}

      {text ? (
        isUser ? (
          <div className="flex w-full min-w-0 flex-col items-end">
            <UserBubbleText text={text} />
            {onRetryUser ? (
              <UserMessageActions
                text={text}
                disabled={actionsDisabled}
                onRetry={() => onRetryUser(message.id)}
              />
            ) : null}
          </div>
        ) : (
          <div className="w-full min-w-0 text-token-body leading-[1.5] text-text-primary">
            <ChatMarkdown content={text} />
            <ChatMessageActions messageId={message.id} text={text} />
          </div>
        )
      ) : null}
    </div>
  );
}
