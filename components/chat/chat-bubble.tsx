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

  return (
    <div
      className={cn(
        "flex w-full min-w-0",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "min-w-0 rounded-token border px-3 py-2 text-token-body",
          isUser
            ? "w-fit max-w-[var(--user-bubble-max-width)] border-border-subtle bg-accent-primary text-text-on-accent"
            : "w-full border-border-subtle bg-surface",
        )}
      >
        {imageUrls.length > 0 ? (
          <div className={cn("flex flex-wrap gap-1.5", text ? "mb-1" : "")}>
            {imageUrls.map((url) => (
              <ChatImage key={url} src={url} size="bubble" />
            ))}
          </div>
        ) : null}

        {text ? (
          isUser ? (
            <p className="break-words whitespace-pre-wrap">{text}</p>
          ) : (
            <>
              <ChatMarkdown content={text} />
              <ChatMessageActions text={text} />
            </>
          )
        ) : null}
      </div>
    </div>
  );
}
