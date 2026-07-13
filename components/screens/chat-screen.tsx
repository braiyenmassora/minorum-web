"use client";

import { ArrowUp, ChevronDown, ImageIcon, Plus } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { ChatBubble } from "@/components/chat/chat-bubble";
import { ImagePreviewPanel } from "@/components/chat/image-preview-panel";
import { ModelPickerPanel } from "@/components/chat/model-picker-panel";
import { ResetChatPanel } from "@/components/chat/reset-chat-panel";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { AppLogo } from "@/components/ui/app-logo";
import type { AppConfig } from "@/lib/core/config/app-config";
import { getModelDisplayName } from "@/lib/core/config/model-label";
import { messageForApiError } from "@/lib/core/copy/api-error-message";
import { getAppCopy } from "@/lib/core/copy/app-copy";
import { pickRandomSuggestions } from "@/lib/core/suggestions/suggestion-pool";
import type { Message } from "@/lib/models/message";
import { buildUserMessageContent, getMessageText } from "@/lib/models/message-content";
import { toChatApiError } from "@/lib/services/chat-api-error";
import { prepareImageAttachment } from "@/lib/services/image-attachment-service";
import { streamChat } from "@/lib/services/chat-service";
import { updateConfigModel } from "@/lib/services/config-storage-service";
import { cn } from "@/lib/utils";

type ChatScreenProps = {
  config: AppConfig;
};

function createMessageId(): string {
  return globalThis.crypto.randomUUID();
}

export function ChatScreen({ config: initialConfig }: ChatScreenProps) {
  const copy = getAppCopy();
  const [config, setConfig] = useState(initialConfig);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [suggestions, setSuggestions] = useState(() => pickRandomSuggestions(3));
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [attachingImage, setAttachingImage] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshSuggestions = useCallback(() => {
    setSuggestions(pickRandomSuggestions(3));
  }, []);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    const container = scrollRef.current;
    const lastMessageEl = lastMessageRef.current;
    if (!container) {
      return;
    }

    requestAnimationFrame(() => {
      const lastMessage = messages[messages.length - 1];

      if (streaming && lastMessage?.role === "assistant") {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        return;
      }

      if (lastMessageEl) {
        lastMessageEl.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
  }, [messages, streaming]);

  const canSend =
    (input.trim().length > 0 || pendingImage !== null) && !streaming;

  const showEmptyState = messages.length === 0 && !streaming;

  const handleSend = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      const imageDataUrl = pendingImage;
      if ((!text && !imageDataUrl) || streaming) {
        return;
      }

      const userMessage: Message = {
        id: createMessageId(),
        role: "user",
        content: buildUserMessageContent(text, imageDataUrl),
      };
      const history = [...messages, userMessage];
      const assistantId = createMessageId();

      setMessages(history);
      setInput("");
      setPendingImage(null);
      setStreaming(true);
      setErrorMessage(null);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        for await (const token of streamChat({
          config,
          messages: history,
          signal: abortController.signal,
        })) {
          setMessages((current) => {
            const assistant = current.find((message) => message.id === assistantId);
            if (!assistant) {
              return [
                ...current,
                { id: assistantId, role: "assistant", content: token },
              ];
            }

            return current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content:
                      (typeof message.content === "string"
                        ? message.content
                        : getMessageText(message.content)) + token,
                  }
                : message,
            );
          });
        }
      } catch (error) {
        const apiError = toChatApiError(error);
        if (apiError.kind !== "cancelled") {
          setErrorMessage(messageForApiError(apiError.kind));
        }

        setMessages((current) =>
          current.filter((message) => message.id !== assistantId),
        );
      } finally {
        setStreaming(false);
        abortRef.current = null;
        textareaRef.current?.focus();
        adjustTextareaHeight();
      }
    },
    [adjustTextareaHeight, config, input, messages, pendingImage, streaming],
  );

  async function handleImageSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setAttachingImage(true);
    setErrorMessage(null);

    try {
      const prepared = await prepareImageAttachment(file);
      setPendingImage(prepared.dataUrl);
      setModelPickerOpen(false);
      setResetOpen(false);
    } catch {
      setErrorMessage(getAppCopy().error_and_snackbar_messages.unknown);
    } finally {
      setAttachingImage(false);
    }
  }

  function handleNewChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setPendingImage(null);
    setErrorMessage(null);
    setStreaming(false);
    refreshSuggestions();
    setResetOpen(false);
  }

  function handleModelSelect(modelName: string) {
    setConfig((current) => updateConfigModel(current, modelName));
    setErrorMessage(null);
    setModelPickerOpen(false);
  }

  function openModelPicker() {
    setResetOpen(false);
    setModelPickerOpen((open) => !open);
  }

  function openResetPanel() {
    setModelPickerOpen(false);
    setResetOpen((open) => !open);
  }

  const showTyping =
    streaming && messages[messages.length - 1]?.role === "user";

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="chat-scroll scroll-pb-composer-top scroll-pt-composer-top min-h-0 flex-1 overflow-y-auto px-[var(--content-inset)]"
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-[var(--chat-max-width)] flex-col gap-chat-message",
            messages.length > 0 && "min-h-full justify-end pt-composer-top",
            showEmptyState && "min-h-full justify-center py-3",
          )}
        >
          {showEmptyState ? (
            <div className="flex flex-col items-center gap-4">
              <AppLogo size={56} />
              <div className="flex flex-col gap-0.5 text-center">
                <h1 className="text-token-title font-medium">
                  {copy.chat_screen_empty_state.title}
                </h1>
                <p className="text-token-body-medium text-text-secondary">
                  {copy.chat_screen_empty_state.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-1">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="max-w-full rounded-token border border-border-subtle bg-surface px-3 py-1.5 text-left text-token-body-medium text-text-primary transition-colors hover:bg-surface-raised"
                    onClick={() => void handleSend(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message, index) => (
            <div
              key={message.id}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
              className="scroll-mt-composer-top"
            >
              <ChatBubble message={message} />
            </div>
          ))}

          {showTyping ? <TypingIndicator /> : null}
        </div>
      </div>

      <div className="inset-screen shrink-0">
        <div className="mx-auto w-full max-w-[var(--chat-max-width)]">
          <div className="overflow-hidden rounded-token border border-border-subtle bg-surface shadow-floating">
            {errorMessage ? (
              <div className="border-b border-border-subtle px-composer py-composer text-token-label text-error">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 px-composer py-composer">
              <button
                type="button"
                className="inline-flex min-w-0 flex-1 items-center gap-1 text-left text-token-body text-text-primary transition-colors hover:text-text-primary disabled:opacity-50"
                onClick={openModelPicker}
                disabled={streaming}
                title={config.modelName}
                aria-expanded={modelPickerOpen}
              >
                <span className="truncate">
                  {getModelDisplayName(config.modelName)}
                </span>
                <ChevronDown
                  className={cn(
                    "size-3 shrink-0 transition-transform",
                    modelPickerOpen && "rotate-180",
                  )}
                />
              </button>
              <button
                type="button"
                className={cn(
                  "inline-flex size-7 shrink-0 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-secondary",
                  resetOpen && "bg-surface-raised text-text-primary",
                )}
                onClick={openResetPanel}
                aria-label={copy.chat_screen_input_header.new_chat}
                aria-expanded={resetOpen}
              >
                <Plus className="size-4" />
              </button>
            </div>

            <ModelPickerPanel
              open={modelPickerOpen}
              config={config}
              onSelect={handleModelSelect}
            />

            <ResetChatPanel
              open={resetOpen}
              onCancel={() => setResetOpen(false)}
              onConfirm={handleNewChat}
            />

            {pendingImage ? (
              <ImagePreviewPanel
                src={pendingImage}
                onRemove={() => setPendingImage(null)}
              />
            ) : null}

            <div
              className={cn(
                "flex items-end gap-3 px-composer py-composer",
                !modelPickerOpen &&
                  !resetOpen &&
                  !pendingImage &&
                  "border-t border-border-subtle",
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                type="button"
                className="inline-flex size-[var(--composer-icon-size)] shrink-0 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary disabled:opacity-40"
                disabled={streaming || attachingImage}
                onClick={() => fileInputRef.current?.click()}
                aria-label={copy.chat_screen_input_header.attach_image}
              >
                <ImageIcon className="size-[var(--icon-size)]" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                rows={1}
                placeholder="Ketik pesan..."
                disabled={streaming}
                className="min-h-[var(--composer-icon-size)] flex-1 resize-none overflow-hidden bg-transparent px-0 py-[7px] text-token-body leading-[1.5] outline-none placeholder:text-text-muted disabled:opacity-50"
              />
              <button
                type="button"
                className={cn(
                  "inline-flex size-[var(--composer-icon-size)] shrink-0 items-center justify-center rounded-token-sm transition-colors",
                  canSend
                    ? "bg-accent-primary text-text-on-accent"
                    : "bg-disabled-bg text-disabled-text",
                )}
                disabled={!canSend}
                onClick={() => void handleSend()}
                aria-label="Kirim"
              >
                <ArrowUp className="size-[var(--icon-size)]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
