import {
  buildChatCompletionsUrl,
  buildModelsUrl,
  type AppConfig,
} from "@/lib/core/config/app-config";
import { systemPrompt } from "@/lib/core/persona/minorum-persona";
import type { ApiMessage, Message } from "@/lib/models/message";
import { toApiMessageContent } from "@/lib/models/message-content";
import {
  ChatApiError,
  classifyHttpStatus,
  isRetryableKind,
  toChatApiError,
} from "@/lib/services/chat-api-error";
import { ChatStreamParser } from "@/lib/services/chat-stream-parser";

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 2;

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

function toApiMessages(messages: Message[]): ApiMessage[] {
  const apiMessages: ApiMessage[] = [{ role: "system", content: systemPrompt }];

  for (const message of messages) {
    apiMessages.push({
      role: message.role,
      content: toApiMessageContent(message.content),
    });
  }

  return apiMessages;
}

export async function testConnection(
  config: AppConfig,
  signal?: AbortSignal,
): Promise<void> {
  await fetchModels(config, signal);
}

export async function fetchModels(
  config: AppConfig,
  signal?: AbortSignal,
): Promise<string[]> {
  const { url, headers } = resolveRequestTarget(config, "models");
  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers,
    signal,
  });

  const data = await parseJsonResponse<{ data?: Array<{ id?: string }> }>(
    response,
  );

  if (!Array.isArray(data.data)) {
    throw new ChatApiError("unknown");
  }

  return [
    ...new Set(
      data.data
        .map((model) => model.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
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
}: {
  config: AppConfig;
  messages: Message[];
  signal?: AbortSignal;
}): Promise<string> {
  const model = requireModelName(config);
  const { url, headers } = resolveRequestTarget(config, "chat/completions");
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      stream: false,
      messages: toApiMessages(messages),
    }),
    signal,
    timeoutMs: 120_000,
  });

  const data = await parseJsonResponse<{
    choices?: Array<{ message?: { content?: string | null } }>;
  }>(response);

  const content = data.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

async function* streamChatAttempt({
  config,
  messages,
  signal,
}: {
  config: AppConfig;
  messages: Message[];
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  const model = requireModelName(config);
  const { url, headers } = resolveRequestTarget(config, "chat/completions");
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      stream: true,
      messages: toApiMessages(messages),
    }),
    signal,
  });

  if (!response.ok) {
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
      const { done, value } = await reader.read();
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
    reader.releaseLock();
  }

  // OmniRoute: some providers (e.g. aug) return only `data: [DONE]` for stream.
  if (!yielded) {
    const content = await completeChat({ config, messages, signal });
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
}: {
  config: AppConfig;
  messages: Message[];
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      yield* streamChatAttempt({ config, messages, signal });
      return;
    } catch (error) {
      const apiError = toChatApiError(error);
      const canRetry = isRetryableKind(apiError.kind) && attempt < MAX_RETRIES;

      if (!canRetry) {
        throw apiError;
      }

      attempt += 1;
    }
  }
}
