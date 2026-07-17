"use client";

import { FileText } from "lucide-react";
import { useState } from "react";

import { ChatImage } from "@/components/chat/chat-image";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { ChatMessageActions } from "@/components/chat/chat-message-actions";
import { PastedTextPreview } from "@/components/chat/pasted-text-preview";
import { UserMessageActions } from "@/components/chat/user-message-actions";
import type { Message } from "@/lib/models/message";
import {
  getMessageFiles,
  getMessageImageUrls,
  getMessageText,
} from "@/lib/models/message-content";
import { cn } from "@/lib/utils";
import { isLongUserText } from "@/lib/utils/long-user-text";
import { normalizeAssistantMarkdown } from "@/lib/utils/normalize-assistant-markdown";

type ChatBubbleProps = {
  message: Message;
  actionsDisabled?: boolean;
  onRetryUser?: (messageId: string) => void;
};

function UserBubbleText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const truncatable = isLongUserText(text);

  if (!truncatable) {
    return (
      <div className="w-fit max-w-[var(--user-bubble-max-width)] min-w-0 rounded-token bg-user-bubble px-3.5 py-2.5 text-token-body leading-[1.55] text-text-on-user">
        <p className="break-words whitespace-pre-wrap">{text}</p>
      </div>
    );
  }

  return (
    <PastedTextPreview
      text={text}
      layout="bubble"
      expanded={expanded}
      onToggleExpand={() => setExpanded((value) => !value)}
    />
  );
}

function ChatFileChip({
  name,
  url,
  alignEnd,
}: {
  name: string;
  url: string;
  alignEnd: boolean;
}) {
  return (
    <a
      href={url}
      download={name}
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-token border border-border-subtle bg-assistant-bubble px-3 py-2 text-token-body-medium text-text-primary transition-colors hover:bg-surface-raised",
        alignEnd && "self-end",
      )}
    >
      <FileText className="size-5 shrink-0 text-text-secondary" aria-hidden />
      <span className="truncate">{name}</span>
    </a>
  );
}

export function ChatBubble({
  message,
  actionsDisabled = false,
  onRetryUser,
}: ChatBubbleProps) {
  const text = getMessageText(message.content);
  const imageUrls = getMessageImageUrls(message.content);
  const files = getMessageFiles(message.content);
  const isUser = message.role === "user";
  const hasMedia = imageUrls.length > 0 || files.length > 0;

  if (!text && !hasMedia) {
    return null;
  }

  const mediaRow = (
    <div
      className={cn(
        "flex flex-wrap gap-1.5",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {imageUrls.map((url) => (
        <ChatImage key={url} src={url} size="bubble" />
      ))}
      {files.map((file) => (
        <ChatFileChip
          key={`${file.name}-${file.url.slice(0, 32)}`}
          name={file.name}
          url={file.url}
          alignEnd={isUser}
        />
      ))}
    </div>
  );

  if (isUser && !text) {
    return (
      <div className="flex w-full min-w-0 flex-col items-end gap-1">
        {mediaRow}
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
        "flex w-full min-w-0 flex-col gap-2.5",
        isUser ? "items-end" : "items-start",
      )}
    >
      {hasMedia ? mediaRow : null}

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
          <div className="w-full min-w-0 text-token-body leading-[var(--chat-markdown-line-height)] text-text-primary">
            <ChatMarkdown content={text} />
            <ChatMessageActions
              messageId={message.id}
              text={normalizeAssistantMarkdown(text)}
            />
          </div>
        )
      ) : null}
    </div>
  );
}
