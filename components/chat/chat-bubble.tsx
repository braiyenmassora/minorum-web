"use client";

import { ChatImage } from "@/components/chat/chat-image";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { ChatMessageActions } from "@/components/chat/chat-message-actions";
import type { Message } from "@/lib/models/message";
import {
  getMessageImageUrls,
  getMessageText,
} from "@/lib/models/message-content";
import { cn } from "@/lib/utils";

type ChatBubbleProps = {
  message: Message;
};

export function ChatBubble({ message }: ChatBubbleProps) {
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
    return <div className="flex w-full min-w-0 justify-end">{imageRow}</div>;
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
          <div className="w-fit max-w-full min-w-0 rounded-token bg-user-bubble px-3 py-2 text-token-body leading-[1.5] text-white">
            <p className="break-words whitespace-pre-wrap">{text}</p>
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
