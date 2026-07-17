import {
  buildChatCompletionsUrl,
  buildModelsUrl,
  type AppConfig,
} from "@/lib/core/config/app-config";
import type { ModelEntry } from "@/lib/core/config/model-label";
import {
  DEFAULT_WEB_TOOLS_CONFIG,
  type WebToolsConfig,
  looksLikeToolRejection,
  resolveWebToolsForModel,
  webToolsActiveForRequest,
} from "@/lib/core/config/web-tools-config";
import { buildSystemPrompt } from "@/lib/core/persona/minorum-persona";
import type { ApiMessage, Message } from "@/lib/models/message";
import { toApiMessageContent } from "@/lib/models/message-content";
import {
  ChatApiError,
  classifyHttpStatus,
  isRetryableKind,
  isToolsRejectedError,
  toChatApiError,
} from "@/lib/services/chat-api-error";
import { ChatStreamParser } from "@/lib/services/chat-stream-parser";

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;
/** Max gap between streamed chunks before we treat the stream as hung. */
const IDLE_READ_TIMEOUT_MS = 30_000;
/** Base backoff between retries; grows exponentially per attempt. */
const RETRY_BACKOFF_MS = 400;

/**
 * A stream attempt is retryable only if it produced no tokens yet (retrying
 * mid-answer would duplicate output), the error kind is transient, and we
 * still have attempts left.
 */
export function shouldRetryStream(
  produced: boolean,
  kind: Parameters<typeof isRetryableKind>[0],
  attempt: number,
  maxRetries: number = MAX_RETRIES,
): boolean {
  return !produced && isRetryableKind(kind) && attempt < maxRetries;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ChatApiError("cancelled"));
      return;
    }
    const onAbort = () => {
      clearTimeout(id);
      reject(new ChatApiError("cancelled"));
    };
    const id = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/** Races a stream read against an idle timeout, cancelling the reader on stall. */
async function readWithIdleTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      // Cancel resolves the pending read so releaseLock() stays safe.
      void reader.cancel().catch(() => {});
      reject(new ChatApiError("timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([reader.read(), timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

type FetchOptions = RequestInit & { timeoutMs?: number };

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function resolveRequestTarget(
  config: AppConfig,
  endpoint: "models" | "chat/completions",
): { url: string; headers: HeadersInit } {
  // Browser: same-origin proxy avoids CORS / mixed-content blocks.
  if (typeof window !== "undefined") {
    return {
      url: `/api/proxy/${endpoint}`,
      headers: {
        ...authHeaders(config.apiKey),
        "X-Minorum-Api-Base": config.apiBaseUrl,
      },
    };
  }

  const url =
    endpoint === "models"
      ? buildModelsUrl(config.apiBaseUrl)
      : buildChatCompletionsUrl(config.apiBaseUrl);

  return { url, headers: authHeaders(config.apiKey) };
}

async function fetchWithTimeout(
  url: string,
  { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init }: FetchOptions,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (signal?.aborted) {
      throw new ChatApiError("cancelled");
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ChatApiError("timeout");
    }
    throw toChatApiError(error);
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new ChatApiError(classifyHttpStatus(response.status));
  }
  return (await response.json()) as T;
}

function toApiMessages(
  messages: Message[],
  webToolsActive: boolean,
): ApiMessage[] {
  const apiMessages: ApiMessage[] = [
    {
      role: "system",
      content: buildSystemPrompt({ webToolsActive }),
    },
  ];

  for (const message of messages) {
    apiMessages.push({
      role: message.role,
      content: toApiMessageContent(message.content),
    });
  }

  return apiMessages;
}

function buildChatCompletionBody({
  model,
  messages,
  stream,
  webToolsConfig,
  attachWebTools,
}: {
  model: string;
  messages: Message[];
  stream: boolean;
  webToolsConfig: WebToolsConfig;
  attachWebTools: boolean;
}): { body: Record<string, unknown>; webToolsActive: boolean } {
  const webToolsActive =
    attachWebTools && webToolsActiveForRequest(model, webToolsConfig);
  const body: Record<string, unknown> = {
    model,
    stream,
    messages: toApiMessages(messages, webToolsActive),
  };

  if (webToolsActive) {
    const tools = resolveWebToolsForModel(model);
    if (tools) {
      body.tools = tools;
    }
  }

  return { body, webToolsActive };
}

export async function testConnection(
  config: AppConfig,
  signal?: AbortSignal,
): Promise<void> {
  await fetchModels(config, signal);
}

export async function fetchModelEntries(
  config: AppConfig,
  signal?: AbortSignal,
): Promise<ModelEntry[]> {
  const { url, headers } = resolveRequestTarget(config, "models");
  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers,
    signal,
  });

  const data = await parseJsonResponse<{
    data?: Array<{ id?: string; owned_by?: string }>;
  }>(response);

  if (!Array.isArray(data.data)) {
    throw new ChatApiError("unknown");
  }

  const seen = new Set<string>();
  const entries: ModelEntry[] = [];
  for (const model of data.data) {
    if (typeof model.id !== "string" || !model.id || seen.has(model.id)) {
      continue;
    }
    seen.add(model.id);
    entries.push({
      id: model.id,
      ownedBy: typeof model.owned_by === "string" ? model.owned_by : undefined,
    });
  }
  return entries;
}

export async function fetchModels(
  config: AppConfig,
  signal?: AbortSignal,
): Promise<string[]> {
  return (await fetchModelEntries(config, signal)).map((entry) => entry.id);
}

function requireModelName(config: AppConfig): string {
  const model = config.modelName.trim();
  if (!model) {
    throw new ChatApiError("unknown");
  }
  return model;
}

async function completeChat({
  config,
  messages,
  signal,
  webToolsConfig,
  attachWebTools,
}: {
  config: AppConfig;
  messages: Message[];
  signal?: AbortSignal;
  webToolsConfig: WebToolsConfig;
  attachWebTools: boolean;
}): Promise<string> {
  const model = requireModelName(config);
  const { url, headers } = resolveRequestTarget(config, "chat/completions");
  const { body } = buildChatCompletionBody({
    model,
    messages,
    stream: false,
    webToolsConfig,
    attachWebTools,
  });
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
    timeoutMs: 120_000,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    if (attachWebTools && looksLikeToolRejection(response.status, errorText)) {
      throw new ChatApiError("tools_rejected");
    }
    throw new ChatApiError(classifyHttpStatus(response.status));
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

async function* streamChatAttempt({
  config,
  messages,
  signal,
  webToolsConfig,
  attachWebTools,
}: {
  config: AppConfig;
  messages: Message[];
  signal?: AbortSignal;
  webToolsConfig: WebToolsConfig;
  attachWebTools: boolean;
}): AsyncGenerator<string> {
  const model = requireModelName(config);
  const { url, headers } = resolveRequestTarget(config, "chat/completions");
  const { body } = buildChatCompletionBody({
    model,
    messages,
    stream: true,
    webToolsConfig,
    attachWebTools,
  });
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    if (attachWebTools && looksLikeToolRejection(response.status, errorText)) {
      throw new ChatApiError("tools_rejected");
    }
    throw new ChatApiError(classifyHttpStatus(response.status));
  }

  if (!response.body) {
    throw new ChatApiError("network");
  }

  const parser = new ChatStreamParser();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let yielded = false;

  try {
    while (true) {
      const { done, value } = await readWithIdleTimeout(
        reader,
        IDLE_READ_TIMEOUT_MS,
      );
      if (done) {
        break;
      }

      for (const token of parser.push(
        decoder.decode(value, { stream: true }),
      )) {
        yielded = true;
        yield token;
      }
    }

    for (const token of parser.flush()) {
      yielded = true;
      yield token;
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Reader may already be cancelled by the idle timeout.
    }
  }

  // OmniRoute: some providers (e.g. aug) return only `data: [DONE]` for stream.
  if (!yielded) {
    const content = await completeChat({
      config,
      messages,
      signal,
      webToolsConfig,
      attachWebTools,
    });
    if (!content.trim()) {
      throw new ChatApiError("unknown");
    }
    yield content;
  }
}

export async function* streamChat({
  config,
  messages,
  signal,
  webToolsConfig = DEFAULT_WEB_TOOLS_CONFIG,
}: {
  config: AppConfig;
  messages: Message[];
  signal?: AbortSignal;
  webToolsConfig?: WebToolsConfig;
}): AsyncGenerator<string> {
  let attempt = 0;
  let toolsDisabled = false;

  while (attempt <= MAX_RETRIES) {
    let produced = false;
    try {
      for await (const token of streamChatAttempt({
        config,
        messages,
        signal,
        webToolsConfig,
        attachWebTools: !toolsDisabled,
      })) {
        produced = true;
        yield token;
      }
      return;
    } catch (error) {
      // Provider rejected tools — retry once without tools so the model stays honest.
      if (!toolsDisabled && !produced && isToolsRejectedError(error)) {
        toolsDisabled = true;
        continue;
      }

      const apiError = toChatApiError(error);
      const canRetry = shouldRetryStream(produced, apiError.kind, attempt);

      if (!canRetry) {
        throw apiError;
      }

      attempt += 1;
      await delay(RETRY_BACKOFF_MS * 2 ** (attempt - 1), signal);
    }
  }
}
