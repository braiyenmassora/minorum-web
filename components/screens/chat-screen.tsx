"use client";

import {
  ArrowUp,
  ChevronDown,
  FileText,
  ImageIcon,
  Menu,
  Plus,
  Square,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ClipboardEvent,
} from "react";

import { ChatBubble } from "@/components/chat/chat-bubble";
import { ChatHistorySidebar } from "@/components/chat/chat-history-sidebar";
import { ChatMessageColumn } from "@/components/chat/chat-message-column";
import {
  DocumentPreviewPanel,
  ImagePreviewPanel,
} from "@/components/chat/image-preview-panel";
import { PastedTextPreview } from "@/components/chat/pasted-text-preview";
import { ModelPickerPanel } from "@/components/chat/model-picker-panel";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { AppLogo } from "@/components/ui/app-logo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggleButton } from "@/components/ui/theme-toggle-button";
import type { AppConfig } from "@/lib/core/config/app-config";
import {
  DEFAULT_WEB_TOOLS_CONFIG,
  type WebToolsConfig,
} from "@/lib/core/config/web-tools-config";
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
  jakartaGreeting,
  serverAlignedNow,
} from "@/lib/utils/jakarta-clock";
import { isLongUserText } from "@/lib/utils/long-user-text";

type ChatScreenProps = {
  config: AppConfig;
  webToolsConfig?: WebToolsConfig;
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
  webToolsConfig = DEFAULT_WEB_TOOLS_CONFIG,
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
  const [pendingPastedText, setPendingPastedText] = useState<string | null>(
    null,
  );
  const [attachingImage, setAttachingImage] = useState(false);
  const [attachingDocument, setAttachingDocument] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [emptySubtitle, setEmptySubtitle] = useState(
    formatJakartaEmptySubtitle,
  );
  const [greeting, setGreeting] = useState(jakartaGreeting);
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
      // CSS max-height may clamp a tall draft on mobile — allow internal scroll.
      textarea.style.overflowY = "auto";
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

    // Honor reduced-motion: JS scroll APIs ignore CSS scroll-behavior.
    const behavior: ScrollBehavior = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
      ? "auto"
      : "smooth";

    requestAnimationFrame(() => {
      const lastMessage = messages[messages.length - 1];

      if (streaming && lastMessage?.role === "assistant") {
        container.scrollTo({ top: container.scrollHeight, behavior });
        return;
      }

      if (lastMessageEl) {
        lastMessageEl.scrollIntoView({ behavior, block: "start" });
        return;
      }

      container.scrollTo({ top: container.scrollHeight, behavior });
    });
  }, [messages, streaming]);

  // Opening the model list grows the composer and shrinks the message pane —
  // keep the viewport pinned to the bottom so history doesn't jump upward.
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || messagesRef.current.length === 0) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [modelPickerOpen]);

  const composerLocked = streaming;
  const attaching = attachingImage || attachingDocument;

  const canSend =
    Boolean(config.modelName.trim()) &&
    (input.trim().length > 0 ||
      Boolean(pendingPastedText?.trim()) ||
      pendingImage !== null ||
      pendingDocument !== null) &&
    !streaming &&
    !attaching;

  const showEmptyState = messages.length === 0 && !streaming;

  const handleComposerInputChange = useCallback(
    (value: string) => {
      if (composerLocked) {
        return;
      }
      if (pendingPastedText) {
        setInput(value);
        return;
      }
      const trimmed = value.trim();
      if (trimmed && isLongUserText(trimmed)) {
        setPendingPastedText(trimmed);
        setInput("");
        return;
      }
      setInput(value);
    },
    [composerLocked, pendingPastedText],
  );

  const handleComposerPaste = useCallback(
    (event: ClipboardEvent<HTMLTextAreaElement>) => {
      if (composerLocked) {
        return;
      }
      const pasted = event.clipboardData.getData("text");
      if (!pasted || !isLongUserText(pasted.trim())) {
        return;
      }
      event.preventDefault();
      setPendingPastedText(pasted.trim());
    },
    [composerLocked],
  );

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const abort = new AbortController();

    const run = async (showChecking: boolean) => {
      // Non-overlap: skip a tick if the previous probe is still running.
      if (inFlight) {
        return;
      }
      inFlight = true;
      if (showChecking && !cancelled) {
        setSystemStatus("checking");
      }
      try {
        const next = await probeSystemStatus(config, abort.signal);
        if (!cancelled) {
          setSystemStatus(next);
        }
      } finally {
        inFlight = false;
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
    // Only re-probe when credentials change; model/name edits don't affect reachability.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiBaseUrl, config.apiKey]);

  useEffect(() => {
    if (!showEmptyState) {
      return;
    }

    let cancelled = false;

    const tick = () => {
      const now = serverAlignedNow(serverClockOffsetMsRef.current);
      setEmptySubtitle(formatJakartaEmptySubtitle(now));
      setGreeting(jakartaGreeting(now));
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
    setPendingPastedText(null);
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
          webToolsConfig,
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
    [
      activeSessionId,
      adjustTextareaHeight,
      config,
      refreshSessions,
      webToolsConfig,
    ],
  );

  const handleSend = useCallback(
    async (rawText?: string) => {
      const pasted = pendingPastedText?.trim() ?? "";
      const caption = (rawText ?? input).trim();
      const text = [pasted, caption].filter(Boolean).join("\n\n");
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
      setPendingPastedText(null);

      await streamFromHistory(history);
    },
    [
      input,
      pendingDocument,
      pendingImage,
      pendingPastedText,
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
    if (!file || pendingPastedText || streaming || attaching) {
      return;
    }

    // Guard against session switches while the file is being processed.
    const epoch = sessionEpochRef.current;
    setAttachingImage(true);
    setErrorMessage(null);

    try {
      const prepared = await prepareImageAttachment(file);
      if (sessionEpochRef.current !== epoch) {
        return;
      }
      setPendingImage(prepared.dataUrl);
      setModelPickerOpen(false);
    } catch {
      if (sessionEpochRef.current === epoch) {
        setErrorMessage(getAppCopy().error_and_snackbar_messages.unknown);
      }
    } finally {
      setAttachingImage(false);
    }
  }

  async function handleDocumentSelect(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || pendingPastedText || streaming || attaching) {
      return;
    }

    const epoch = sessionEpochRef.current;
    setAttachingDocument(true);
    setErrorMessage(null);

    try {
      const prepared = await prepareDocumentAttachment(file);
      if (sessionEpochRef.current !== epoch) {
        return;
      }
      setPendingDocument({
        dataUrl: prepared.dataUrl,
        fileName: prepared.fileName,
      });
      setModelPickerOpen(false);
    } catch (error) {
      if (sessionEpochRef.current === epoch) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : getAppCopy().error_and_snackbar_messages.unknown,
        );
      }
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
    setPendingPastedText(null);
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
          className="w-[min(280px,85vw)] gap-0 border-0 p-0 pt-[env(safe-area-inset-top,0px)] sm:max-w-[280px]"
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

      <main
        className="flex min-w-0 flex-1 flex-col"
        aria-busy={streaming}
        aria-label={copy.chat_history_sidebar.title}
      >
        <header className="flex shrink-0 items-center gap-1.5 border-b border-border-subtle pt-[max(0.5rem,env(safe-area-inset-top,0px))] pb-2 pl-[max(var(--content-inset),env(safe-area-inset-left,0px))] pr-[max(var(--content-inset),env(safe-area-inset-right,0px))] md:hidden">
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary active:bg-surface-raised"
            onClick={() => setHistoryOpen(true)}
            aria-label={copy.chat_history_sidebar.title}
          >
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <AppLogo size={28} className="shrink-0 rounded-full" />
            <span className="font-display truncate text-token-body font-extrabold tracking-tight text-text-primary">
              Minorum
            </span>
          </div>
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary active:bg-surface-raised"
            onClick={handleNewChat}
            aria-label={copy.chat_history_sidebar.new_chat}
          >
            <Plus className="size-5" />
          </button>
          <ThemeToggleButton className="size-11 shrink-0" />
        </header>

        <div
          ref={scrollRef}
          className="chat-scroll scroll-pb-composer-top scroll-pt-composer-top min-h-0 flex-1 overflow-y-auto overscroll-contain pl-[max(var(--content-inset),env(safe-area-inset-left,0px))] pr-[max(var(--content-inset),env(safe-area-inset-right,0px))]"
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
                    {config.fullName.trim()
                      ? `${greeting}, ${config.fullName.trim().split(/\s+/)[0]}`
                      : greeting}
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
          <div
            ref={modelPickerRef}
            className="relative mx-auto w-full max-w-[var(--chat-max-width)]"
          >
            {modelPickerOpen ? (
              <div className="absolute inset-x-0 bottom-full z-30 mb-2 max-h-[min(50dvh,22rem)] overflow-hidden rounded-token border border-border-subtle bg-assistant-bubble shadow-floating">
                <ModelPickerPanel
                  config={config}
                  onSelect={handleModelSelect}
                />
              </div>
            ) : null}

            <div className="overflow-hidden rounded-token border border-border-subtle bg-assistant-bubble shadow-floating">
              {errorMessage ? (
                <div
                  role="alert"
                  className="border-b border-border-subtle px-composer py-composer text-token-label text-error"
                >
                  {errorMessage}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-2 px-composer py-composer">
                <button
                  type="button"
                  className="inline-flex min-w-0 flex-1 items-center gap-1 text-left text-token-body font-bold text-text-primary transition-opacity hover:opacity-80 disabled:pointer-events-none"
                  onClick={openModelPicker}
                  disabled={composerLocked}
                  title={config.modelName}
                  aria-haspopup="listbox"
                  aria-expanded={modelPickerOpen}
                  aria-controls="model-picker-panel"
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
                    disabled={
                      composerLocked || attaching || pendingPastedText !== null
                    }
                    onChange={handleImageSelect}
                  />
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept={DOCUMENT_FILE_ACCEPT}
                    className="hidden"
                    disabled={
                      composerLocked || attaching || pendingPastedText !== null
                    }
                    onChange={(event) => void handleDocumentSelect(event)}
                  />
                  <button
                    type="button"
                    className="inline-flex size-[var(--composer-icon-size)] items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary disabled:opacity-40"
                    disabled={
                      composerLocked || attaching || pendingPastedText !== null
                    }
                    onClick={() => {
                      if (composerLocked || attaching) {
                        return;
                      }
                      fileInputRef.current?.click();
                    }}
                    aria-label={copy.chat_screen_input_header.attach_image}
                  >
                    <ImageIcon className="size-[var(--icon-size)]" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex size-[var(--composer-icon-size)] items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary disabled:opacity-40"
                    disabled={
                      composerLocked || attaching || pendingPastedText !== null
                    }
                    onClick={() => {
                      if (composerLocked || attaching) {
                        return;
                      }
                      documentInputRef.current?.click();
                    }}
                    aria-label={copy.chat_screen_input_header.attach_document}
                  >
                    <FileText className="size-[var(--icon-size)]" />
                  </button>
                </div>
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

              {pendingPastedText ? (
                <PastedTextPreview
                  layout="composer"
                  text={pendingPastedText}
                  onRemove={() => setPendingPastedText(null)}
                />
              ) : null}

              <div
                className={cn(
                  "flex items-end gap-3 px-composer py-composer",
                  !pendingImage &&
                    !pendingDocument &&
                    !pendingPastedText &&
                    "border-t border-border-subtle",
                )}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) =>
                    handleComposerInputChange(event.target.value)
                  }
                  onPaste={handleComposerPaste}
                  onKeyDown={handleComposerKeyDown}
                  rows={1}
                  enterKeyHint="enter"
                  placeholder={copy.chat_screen_input_header.placeholder}
                  aria-label={copy.chat_screen_input_header.placeholder}
                  disabled={composerLocked}
                  className="composer-textarea min-h-[var(--composer-icon-size)] flex-1 resize-none rounded-token-sm bg-transparent px-0 py-[7px] text-base leading-[1.5] outline-none focus-visible:outline-2 focus-visible:outline-focus-ring placeholder:text-text-muted disabled:opacity-50 md:text-token-body"
                />
                {streaming ? (
                  <button
                    type="button"
                    className="inline-flex size-[var(--composer-icon-size)] shrink-0 items-center justify-center rounded-token-sm bg-accent-primary text-text-on-accent transition-colors"
                    onClick={() => abortRef.current?.abort()}
                    aria-label="Stop generating"
                  >
                    <Square
                      className="size-[calc(var(--icon-size)-4px)]"
                      fill="currentColor"
                    />
                  </button>
                ) : (
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
                    aria-label="Send"
                  >
                    <ArrowUp className="size-[var(--icon-size)]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
