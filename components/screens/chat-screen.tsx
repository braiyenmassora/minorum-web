"use client";

import {
  ArrowUp,
  ChevronDown,
  FileText,
  ImageIcon,
  Menu,
  Plus,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ChatBubble } from "@/components/chat/chat-bubble";
import { ChatHistorySidebar } from "@/components/chat/chat-history-sidebar";
import { ChatMessageColumn } from "@/components/chat/chat-message-column";
import {
  DocumentPreviewPanel,
  ImagePreviewPanel,
} from "@/components/chat/image-preview-panel";
import { ModelPickerPanel } from "@/components/chat/model-picker-panel";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { AppLogo } from "@/components/ui/app-logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { AppConfig } from "@/lib/core/config/app-config";
import {
  comboIdsFromEntries,
  getModelDisplayName,
  resolveModelSelection,
} from "@/lib/core/config/model-label";
import { messageForApiError } from "@/lib/core/copy/api-error-message";
import { getAppCopy } from "@/lib/core/copy/app-copy";
import type { ChatSession } from "@/lib/models/chat-session";
import type { Message } from "@/lib/models/message";
import {
  buildUserMessageContent,
  getMessageText,
} from "@/lib/models/message-content";
import { toChatApiError } from "@/lib/services/chat-api-error";
import {
  clearChatSessions,
  deleteChatSession,
  getChatSession,
  listChatSessions,
  upsertChatSession,
} from "@/lib/services/chat-history-storage-service";
import { prepareImageAttachment } from "@/lib/services/image-attachment-service";
import {
  DOCUMENT_FILE_ACCEPT,
  prepareDocumentAttachment,
} from "@/lib/services/document-attachment-service";
import { fetchModelEntries, streamChat } from "@/lib/services/chat-service";
import { updateConfigModel } from "@/lib/services/config-storage-service";
import {
  probeSystemStatus,
  STATUS_POLL_MS,
  type SystemStatus,
} from "@/lib/services/system-status-service";
import { cn } from "@/lib/utils";
import {
  fetchServerClockOffsetMs,
  formatJakartaEmptySubtitle,
  serverAlignedNow,
} from "@/lib/utils/jakarta-clock";

type ChatScreenProps = {
  config: AppConfig;
  onLogout: () => void;
};

type PendingDocument = {
  dataUrl: string;
  fileName: string;
};

const COMPOSER_GROW_CHAR_LIMIT = 300;

function createId(): string {
  return globalThis.crypto.randomUUID();
}

export function ChatScreen({
  config: initialConfig,
  onLogout,
}: ChatScreenProps) {
  const copy = getAppCopy();
  const [config, setConfig] = useState(initialConfig);
  const [configFromParent, setConfigFromParent] = useState(initialConfig);
  if (initialConfig !== configFromParent) {
    setConfigFromParent(initialConfig);
    setConfig(initialConfig);
  }
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingDocument, setPendingDocument] =
    useState<PendingDocument | null>(null);
  const [attachingImage, setAttachingImage] = useState(false);
  const [attachingDocument, setAttachingDocument] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [emptySubtitle, setEmptySubtitle] = useState(
    formatJakartaEmptySubtitle,
  );
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("checking");
  const [historyOpen, setHistoryOpen] = useState(false);
  const serverClockOffsetMsRef = useRef(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);
  const sessionEpochRef = useRef(0);

  const refreshSessions = useCallback(() => {
    setSessions(listChatSessions());
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    void Promise.resolve().then(refreshSessions);
  }, [refreshSessions]);

  useEffect(() => {
    if (!modelPickerOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (modelPickerRef.current?.contains(target)) {
        return;
      }
      setModelPickerOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setModelPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [modelPickerOpen]);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    // Always measure from DOM value — stale React `input` after send re-expands the box.
    const value = textarea.value;
    textarea.style.height = "auto";
    textarea.style.overflowY = "hidden";

    if (value.length === 0) {
      textarea.style.height = "";
      return;
    }

    if (value.length <= COMPOSER_GROW_CHAR_LIMIT) {
      textarea.style.height = `${textarea.scrollHeight}px`;
      return;
    }

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    textarea.value = value.slice(0, COMPOSER_GROW_CHAR_LIMIT);
    const cappedHeight = textarea.scrollHeight;
    textarea.value = value;
    textarea.setSelectionRange(selectionStart, selectionEnd);
    textarea.style.height = `${cappedHeight}px`;
    textarea.style.overflowY = "auto";
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const entries = await fetchModelEntries(config);
        if (cancelled || entries.length === 0) {
          return;
        }

        const modelIds = entries.map((entry) => entry.id);
        const comboIds = comboIdsFromEntries(entries);

        setConfig((current) => {
          const resolved = resolveModelSelection(
            current.modelName,
            modelIds,
            "DealWithSign",
            comboIds,
          );
          if (!resolved || resolved === current.modelName) {
            return current;
          }
          return updateConfigModel(current, resolved);
        });
      } catch {
        // User can pick manually from the model list.
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-resolve when API endpoint changes or model is missing/stale on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- modelName read via setConfig
  }, [config.apiBaseUrl, config.apiKey]);

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
    Boolean(config.modelName.trim()) &&
    (input.trim().length > 0 ||
      pendingImage !== null ||
      pendingDocument !== null) &&
    !streaming;

  const showEmptyState = messages.length === 0 && !streaming;

  useEffect(() => {
    let cancelled = false;
    const abort = new AbortController();

    const run = async (showChecking: boolean) => {
      if (showChecking && !cancelled) {
        setSystemStatus("checking");
      }
      const next = await probeSystemStatus(config, abort.signal);
      if (!cancelled) {
        setSystemStatus(next);
      }
    };

    void run(true);
    const id = window.setInterval(() => {
      void run(false);
    }, STATUS_POLL_MS);

    return () => {
      cancelled = true;
      abort.abort();
      window.clearInterval(id);
    };
  }, [config]);

  useEffect(() => {
    if (!showEmptyState) {
      return;
    }

    let cancelled = false;

    const tick = () => {
      setEmptySubtitle(
        formatJakartaEmptySubtitle(
          serverAlignedNow(serverClockOffsetMsRef.current),
        ),
      );
    };

    void fetchServerClockOffsetMs()
      .then((offsetMs) => {
        if (cancelled) {
          return;
        }
        serverClockOffsetMsRef.current = offsetMs;
        tick();
      })
      .catch(() => {
        if (!cancelled) {
          tick();
        }
      });

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [showEmptyState]);

  const startNewSession = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    sessionEpochRef.current += 1;
    messagesRef.current = [];
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
    setPendingImage(null);
    setPendingDocument(null);
    setErrorMessage(null);
    setStreaming(false);
    setModelPickerOpen(false);
  }, []);

  const streamFromHistory = useCallback(
    async (history: Message[], apiHistory?: Message[]) => {
      if (
        abortRef.current ||
        history.length === 0 ||
        !config.modelName.trim()
      ) {
        return;
      }

      const epoch = sessionEpochRef.current;
      const sessionId = activeSessionId ?? createId();
      if (!activeSessionId) {
        setActiveSessionId(sessionId);
      }

      const assistantId = createId();
      const requestMessages = apiHistory ?? history;

      setMessages(history);
      messagesRef.current = history;
      setStreaming(true);
      setErrorMessage(null);

      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        for await (const token of streamChat({
          config,
          messages: requestMessages,
          signal: abortController.signal,
        })) {
          if (sessionEpochRef.current !== epoch) {
            return;
          }

          setMessages((current) => {
            if (sessionEpochRef.current !== epoch) {
              return current;
            }

            const assistant = current.find(
              (message) => message.id === assistantId,
            );
            const next = !assistant
              ? [
                  ...current,
                  {
                    id: assistantId,
                    role: "assistant" as const,
                    content: token,
                  },
                ]
              : current.map((message) =>
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
            messagesRef.current = next;
            return next;
          });
        }
      } catch (error) {
        if (sessionEpochRef.current !== epoch) {
          return;
        }

        const apiError = toChatApiError(error);
        if (apiError.kind !== "cancelled") {
          setErrorMessage(messageForApiError(apiError.kind));
        }

        setMessages((current) => {
          if (sessionEpochRef.current !== epoch) {
            return current;
          }

          const cleaned = current.filter(
            (message) => message.id !== assistantId,
          );
          messagesRef.current = cleaned;
          return cleaned;
        });
      } finally {
        if (sessionEpochRef.current !== epoch) {
          return;
        }

        setStreaming(false);
        abortRef.current = null;
        textareaRef.current?.focus();
        adjustTextareaHeight();
        window.setTimeout(() => {
          if (sessionEpochRef.current !== epoch) {
            return;
          }

          const latest = messagesRef.current;
          if (latest.length > 0) {
            upsertChatSession({ id: sessionId, messages: latest });
            refreshSessions();
          }
        }, 0);
      }
    },
    [activeSessionId, adjustTextareaHeight, config, refreshSessions],
  );

  const handleSend = useCallback(
    async (rawText?: string) => {
      const text = (rawText ?? input).trim();
      const imageDataUrl = pendingImage;
      const document = pendingDocument;
      if (
        !config.modelName.trim() ||
        (!text && !imageDataUrl && !document) ||
        streaming ||
        abortRef.current
      ) {
        return;
      }

      const userMessage: Message = {
        id: createId(),
        role: "user",
        content: buildUserMessageContent(text, imageDataUrl, document),
      };
      const history = [...messagesRef.current, userMessage];

      setInput("");
      setPendingImage(null);
      setPendingDocument(null);

      await streamFromHistory(history);
    },
    [
      input,
      pendingDocument,
      pendingImage,
      streaming,
      streamFromHistory,
      config,
    ],
  );

  const handleRetryUser = useCallback(
    (messageId: string) => {
      if (streaming || !config.modelName.trim()) {
        return;
      }

      const index = messagesRef.current.findIndex(
        (message) => message.id === messageId,
      );
      if (index < 0 || messagesRef.current[index]?.role !== "user") {
        return;
      }

      void streamFromHistory(messagesRef.current.slice(0, index + 1));
    },
    [streaming, streamFromHistory, config.modelName],
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
    } catch {
      setErrorMessage(getAppCopy().error_and_snackbar_messages.unknown);
    } finally {
      setAttachingImage(false);
    }
  }

  async function handleDocumentSelect(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setAttachingDocument(true);
    setErrorMessage(null);

    try {
      const prepared = await prepareDocumentAttachment(file);
      setPendingDocument({
        dataUrl: prepared.dataUrl,
        fileName: prepared.fileName,
      });
      setModelPickerOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : getAppCopy().error_and_snackbar_messages.unknown,
      );
    } finally {
      setAttachingDocument(false);
    }
  }

  function handleNewChat() {
    startNewSession();
    setHistoryOpen(false);
  }

  function handleSelectSession(sessionId: string) {
    if (sessionId === activeSessionId) {
      setHistoryOpen(false);
      return;
    }

    abortRef.current?.abort();
    abortRef.current = null;
    sessionEpochRef.current += 1;

    const session = getChatSession(sessionId);
    if (!session) {
      refreshSessions();
      return;
    }

    messagesRef.current = session.messages;
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setInput("");
    setPendingImage(null);
    setPendingDocument(null);
    setErrorMessage(null);
    setStreaming(false);
    setModelPickerOpen(false);
    setHistoryOpen(false);
  }

  function handleDeleteSession(sessionId: string) {
    deleteChatSession(sessionId);
    refreshSessions();

    if (sessionId === activeSessionId) {
      startNewSession();
    }
  }

  function handleClearAllSessions() {
    if (sessions.length === 0) {
      return;
    }

    clearChatSessions();
    refreshSessions();
    startNewSession();
    setHistoryOpen(false);
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    // Soft keyboards: Enter = newline; send via the button.
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    event.preventDefault();
    void handleSend();
  }

  function handleModelSelect(modelName: string) {
    setConfig((current) => updateConfigModel(current, modelName));
    setErrorMessage(null);
    setModelPickerOpen(false);
  }

  function openModelPicker() {
    setModelPickerOpen((open) => !open);
  }

  const showTyping =
    streaming && messages[messages.length - 1]?.role === "user";

  const sidebarProps = {
    sessions,
    activeSessionId,
    accountName: config.fullName,
    systemStatus,
    onNewChat: handleNewChat,
    onSelect: handleSelectSession,
    onDelete: handleDeleteSession,
    onClearAll: handleClearAllSessions,
    onLogout,
  };

  return (
    <div className="flex h-full min-h-0 flex-1 items-stretch">
      <ChatHistorySidebar {...sidebarProps} className="hidden md:flex" />

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[min(280px,85vw)] gap-0 border-0 p-0 sm:max-w-[280px]"
        >
          <SheetTitle className="sr-only">
            {copy.chat_history_sidebar.title}
          </SheetTitle>
          <ChatHistorySidebar
            {...sidebarProps}
            className="w-full after:hidden"
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-[var(--content-inset)] pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2 md:hidden">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
            onClick={() => setHistoryOpen(true)}
            aria-label={copy.chat_history_sidebar.title}
          >
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <AppLogo size={28} className="shrink-0 rounded-full" />
            <span className="truncate text-token-body font-medium text-text-primary">
              Minorum
            </span>
          </div>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
            onClick={handleNewChat}
            aria-label={copy.chat_history_sidebar.new_chat}
          >
            <Plus className="size-5" />
          </button>
        </header>

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
                <AppLogo size={56} priority />
                <div className="flex flex-col gap-1 text-center">
                  <h1 className="text-[24px] leading-[1.2] font-medium tracking-[-0.48px] text-text-primary">
                    {copy.chat_screen_empty_state.title}
                  </h1>
                  <p className="text-token-body text-text-secondary">
                    {emptySubtitle}
                  </p>
                </div>
              </div>
            ) : null}

            {messages.length > 0 ? (
              <ChatMessageColumn>
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    ref={
                      index === messages.length - 1 ? lastMessageRef : undefined
                    }
                    className="scroll-mt-composer-top"
                  >
                    <ChatBubble
                      message={message}
                      actionsDisabled={streaming}
                      onRetryUser={handleRetryUser}
                    />
                  </div>
                ))}

                {showTyping ? <TypingIndicator /> : null}
              </ChatMessageColumn>
            ) : null}
          </div>
        </div>

        <div className="inset-screen shrink-0">
          <div className="mx-auto w-full max-w-[var(--chat-max-width)]">
            <div className="overflow-hidden rounded-token border border-border-subtle bg-assistant-bubble shadow-floating">
              {errorMessage ? (
                <div className="border-b border-border-subtle px-composer py-composer text-token-label text-error">
                  {errorMessage}
                </div>
              ) : null}

              <div ref={modelPickerRef}>
                <div className="flex items-center justify-between gap-2 px-composer py-composer">
                  <button
                    type="button"
                    className="inline-flex min-w-0 flex-1 items-center gap-1 text-left text-token-body font-bold text-white transition-opacity hover:opacity-80 disabled:pointer-events-none"
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
                  <div className="flex shrink-0 items-center justify-end gap-0.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    <input
                      ref={documentInputRef}
                      type="file"
                      accept={DOCUMENT_FILE_ACCEPT}
                      className="hidden"
                      onChange={(event) => void handleDocumentSelect(event)}
                    />
                    <button
                      type="button"
                      className="inline-flex size-[var(--composer-icon-size)] items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary disabled:opacity-40"
                      disabled={streaming || attachingImage}
                      onClick={() => fileInputRef.current?.click()}
                      aria-label={copy.chat_screen_input_header.attach_image}
                    >
                      <ImageIcon className="size-[var(--icon-size)]" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-[var(--composer-icon-size)] items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary disabled:opacity-40"
                      disabled={streaming || attachingDocument}
                      onClick={() => documentInputRef.current?.click()}
                      aria-label={copy.chat_screen_input_header.attach_document}
                    >
                      <FileText className="size-[var(--icon-size)]" />
                    </button>
                  </div>
                </div>

                {modelPickerOpen ? (
                  <ModelPickerPanel
                    config={config}
                    onSelect={handleModelSelect}
                  />
                ) : null}
              </div>

              {pendingImage ? (
                <ImagePreviewPanel
                  src={pendingImage}
                  onRemove={() => setPendingImage(null)}
                />
              ) : null}

              {pendingDocument ? (
                <DocumentPreviewPanel
                  fileName={pendingDocument.fileName}
                  onRemove={() => setPendingDocument(null)}
                />
              ) : null}

              <div
                className={cn(
                  "flex items-end gap-3 px-composer py-composer",
                  !modelPickerOpen &&
                    !pendingImage &&
                    !pendingDocument &&
                    "border-t border-border-subtle",
                )}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  rows={1}
                  enterKeyHint="enter"
                  placeholder={copy.chat_screen_input_header.placeholder}
                  disabled={streaming}
                  className="composer-textarea min-h-[var(--composer-icon-size)] flex-1 resize-none bg-transparent px-0 py-[7px] text-base leading-[1.5] outline-none placeholder:text-text-muted disabled:opacity-50 md:text-token-body"
                />
                <button
                  type="button"
                  className={cn(
                    "inline-flex size-[var(--composer-icon-size)] shrink-0 items-center justify-center rounded-token-sm transition-colors",
                    canSend
                      ? "bg-user-bubble text-white"
                      : "bg-disabled-bg text-disabled-text",
                  )}
                  disabled={!canSend}
                  onClick={() => void handleSend()}
                  aria-label="Send"
                >
                  <ArrowUp className="size-[var(--icon-size)]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
