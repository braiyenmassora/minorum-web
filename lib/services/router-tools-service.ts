import type { AppConfig } from "@/lib/core/config/app-config";
import { getMessageText } from "@/lib/models/message-content";
import {
  ChatApiError,
  classifyHttpStatus,
  toChatApiError,
} from "@/lib/services/chat-api-error";
import { listChatSessions } from "@/lib/services/chat-history-storage-service";

const DEFAULT_TIMEOUT_MS = 90_000;
const MODEL_CACHE_MS = 60_000;

type CapabilityKind = "image" | "web" | "stt" | "embedding";

type CachedModels = { at: number; ids: string[]; kinds: Map<string, string> };

const modelCache = new Map<string, CachedModels>();

function proxyHeaders(config: AppConfig, json = true): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "X-Minorum-Api-Base": config.apiBaseUrl,
  };
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = init;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    return await fetch(url, { ...rest, signal: controller.signal });
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

function pickPreferred(ids: string[], prefer: string[]): string | null {
  for (const needle of prefer) {
    const hit = ids.find(
      (id) => id === needle || id.endsWith(`/${needle}`) || id.includes(needle),
    );
    if (hit) {
      return hit;
    }
  }
  return ids[0] ?? null;
}

async function listCapabilityModels(
  config: AppConfig,
  kind: CapabilityKind,
  signal?: AbortSignal,
): Promise<CachedModels> {
  const cacheKey = `${config.apiBaseUrl}:${kind}`;
  const cached = modelCache.get(cacheKey);
  if (cached && Date.now() - cached.at < MODEL_CACHE_MS) {
    return cached;
  }

  const response = await fetchWithTimeout(`/api/proxy/models/${kind}`, {
    method: "GET",
    headers: proxyHeaders(config, false),
    signal,
  });
  if (!response.ok) {
    throw new ChatApiError(classifyHttpStatus(response.status));
  }

  const body = (await response.json()) as {
    data?: Array<{ id?: string; kind?: string }>;
  };
  const kinds = new Map<string, string>();
  const ids = [
    ...new Set(
      (body.data ?? [])
        .map((entry) => {
          if (typeof entry.id !== "string" || !entry.id) {
            return null;
          }
          if (typeof entry.kind === "string") {
            kinds.set(entry.id, entry.kind);
          }
          return entry.id;
        })
        .filter((id): id is string => id !== null),
    ),
  ];

  const next = { at: Date.now(), ids, kinds };
  modelCache.set(cacheKey, next);
  return next;
}

async function resolveModel(
  config: AppConfig,
  kind: CapabilityKind,
  prefer: string[],
  filter?: (id: string, kinds: Map<string, string>) => boolean,
  signal?: AbortSignal,
): Promise<string> {
  const listed = await listCapabilityModels(config, kind, signal);
  const pool = filter
    ? listed.ids.filter((id) => filter(id, listed.kinds))
    : listed.ids;
  const model = pickPreferred(pool, prefer);
  if (!model) {
    throw new ChatApiError("unknown");
  }
  return model;
}

export type WebSearchHit = {
  title: string;
  url: string;
  snippet: string;
};

export async function generateImageDataUrl(
  config: AppConfig,
  prompt: string,
  signal?: AbortSignal,
): Promise<string> {
  const model = await resolveModel(
    config,
    "image",
    ["dall-e-3", "dall-e", "flux", "imagen", "gemini", "sdxl"],
    undefined,
    signal,
  );

  const response = await fetchWithTimeout("/api/proxy/images/generations", {
    method: "POST",
    headers: proxyHeaders(config),
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
    signal,
    timeoutMs: 120_000,
  });

  if (!response.ok) {
    throw new ChatApiError(classifyHttpStatus(response.status));
  }

  const body = (await response.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>;
  };
  const first = body.data?.[0];
  if (first?.b64_json) {
    return `data:image/png;base64,${first.b64_json}`;
  }
  if (first?.url) {
    return first.url;
  }
  throw new ChatApiError("unknown");
}

export async function webSearch(
  config: AppConfig,
  query: string,
  signal?: AbortSignal,
): Promise<WebSearchHit[]> {
  const model = await resolveModel(
    config,
    "web",
    ["search-combo", "tavily", "brave", "searxng", "serper", "exa"],
    (id, kinds) => {
      const kind = kinds.get(id);
      if (kind) {
        return kind === "webSearch";
      }
      return !id.includes("/fetch");
    },
    signal,
  );

  const response = await fetchWithTimeout("/api/proxy/search", {
    method: "POST",
    headers: proxyHeaders(config),
    body: JSON.stringify({ model, query, max_results: 5 }),
    signal,
  });

  if (!response.ok) {
    throw new ChatApiError(classifyHttpStatus(response.status));
  }

  const body = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; snippet?: string }>;
    answer?: string | null;
  };

  const hits = (body.results ?? [])
    .map((row) => ({
      title: row.title?.trim() || row.url?.trim() || "Result",
      url: row.url?.trim() || "",
      snippet: row.snippet?.trim() || "",
    }))
    .filter((row) => row.url.length > 0 || row.snippet.length > 0);

  if (hits.length === 0 && body.answer?.trim()) {
    return [{ title: "Summary", url: "", snippet: body.answer.trim() }];
  }

  return hits;
}

export async function webFetchMarkdown(
  config: AppConfig,
  url: string,
  signal?: AbortSignal,
): Promise<{ title: string; text: string }> {
  const model = await resolveModel(
    config,
    "web",
    ["fetch-combo", "jina", "firecrawl", "tavily", "exa"],
    (id, kinds) => {
      const kind = kinds.get(id);
      if (kind) {
        return kind === "webFetch";
      }
      return (
        id.includes("fetch") || id.includes("jina") || id.includes("firecrawl")
      );
    },
    signal,
  );

  const response = await fetchWithTimeout("/api/proxy/web/fetch", {
    method: "POST",
    headers: proxyHeaders(config),
    body: JSON.stringify({
      model,
      url,
      format: "markdown",
      max_characters: 8000,
    }),
    signal,
  });

  if (!response.ok) {
    throw new ChatApiError(classifyHttpStatus(response.status));
  }

  const body = (await response.json()) as {
    title?: string;
    content?: { text?: string } | string;
  };

  const text =
    typeof body.content === "string"
      ? body.content
      : (body.content?.text ?? "");

  if (!text.trim()) {
    throw new ChatApiError("unknown");
  }

  return { title: body.title?.trim() || url, text: text.trim() };
}

const URL_ONLY = /^https?:\/\/\S+$/i;

export function looksLikeUrlOnly(text: string): boolean {
  return URL_ONLY.test(text.trim());
}

export function formatWebHits(hits: WebSearchHit[]): string {
  if (hits.length === 0) {
    return "No search results.";
  }
  return hits
    .map((hit, index) => {
      const link = hit.url ? `\n${hit.url}` : "";
      const snip = hit.snippet ? `\n${hit.snippet}` : "";
      return `${index + 1}. ${hit.title}${link}${snip}`;
    })
    .join("\n\n");
}

export async function buildWebContext(
  config: AppConfig,
  text: string,
  signal?: AbortSignal,
): Promise<string> {
  const trimmed = text.trim();
  if (looksLikeUrlOnly(trimmed)) {
    const page = await webFetchMarkdown(config, trimmed, signal);
    return `URL: ${trimmed}\nTitle: ${page.title}\n\n${page.text}`;
  }

  return formatWebHits(await webSearch(config, trimmed, signal));
}

export async function transcribeAudio(
  config: AppConfig,
  blob: Blob,
  signal?: AbortSignal,
): Promise<string> {
  const model = await resolveModel(
    config,
    "stt",
    ["whisper-1", "whisper", "groq", "deepgram", "gemini"],
    undefined,
    signal,
  );

  const form = new FormData();
  form.append("model", model);
  form.append("file", blob, "speech.webm");
  form.append("language", "id");

  const response = await fetchWithTimeout("/api/proxy/audio/transcriptions", {
    method: "POST",
    headers: proxyHeaders(config, false),
    body: form,
    signal,
    timeoutMs: 120_000,
  });

  if (!response.ok) {
    throw new ChatApiError(classifyHttpStatus(response.status));
  }

  const body = (await response.json()) as { text?: string };
  const text = body.text?.trim() ?? "";
  if (!text) {
    throw new ChatApiError("unknown");
  }
  return text;
}

export async function embedTexts(
  config: AppConfig,
  inputs: string[],
  signal?: AbortSignal,
): Promise<number[][]> {
  if (inputs.length === 0) {
    return [];
  }

  const model = await resolveModel(
    config,
    "embedding",
    [
      "text-embedding-3-small",
      "text-embedding-3",
      "text-embedding",
      "embedding",
      "voyage",
      "gemini",
    ],
    undefined,
    signal,
  );

  const response = await fetchWithTimeout("/api/proxy/embeddings", {
    method: "POST",
    headers: proxyHeaders(config),
    body: JSON.stringify({ model, input: inputs }),
    signal,
  });

  if (!response.ok) {
    throw new ChatApiError(classifyHttpStatus(response.status));
  }

  const body = (await response.json()) as {
    data?: Array<{ embedding?: number[]; index?: number }>;
  };

  const rows = [...(body.data ?? [])].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  if (rows.length !== inputs.length) {
    throw new ChatApiError("unknown");
  }

  return rows.map((row) => {
    if (!Array.isArray(row.embedding) || row.embedding.length === 0) {
      throw new ChatApiError("unknown");
    }
    return row.embedding;
  });
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < n; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) {
    return 0;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const MEMORY_MAX_SNIPPETS = 40;
const MEMORY_TOP_K = 3;
const MEMORY_MIN_SCORE = 0.35;
const MEMORY_MIN_CHARS = 24;
const MEMORY_SNIPPET_CHARS = 500;

export type MemorySnippet = { label: string; text: string };

/** Collect past chat snippets for RAG. Skips the active session. */
export function collectMemorySnippets(
  excludeSessionId?: string | null,
): MemorySnippet[] {
  const snippets: MemorySnippet[] = [];

  for (const session of listChatSessions()) {
    if (excludeSessionId && session.id === excludeSessionId) {
      continue;
    }
    for (const message of session.messages) {
      const text = getMessageText(message.content).trim();
      if (text.length < MEMORY_MIN_CHARS) {
        continue;
      }
      snippets.push({
        label: `${session.title} · ${message.role}`,
        text: text.slice(0, MEMORY_SNIPPET_CHARS),
      });
      if (snippets.length >= MEMORY_MAX_SNIPPETS) {
        return snippets;
      }
    }
  }

  return snippets;
}

export function rankMemorySnippets(
  queryEmbedding: number[],
  snippets: MemorySnippet[],
  embeddings: number[][],
): Array<MemorySnippet & { score: number }> {
  return snippets
    .map((snippet, index) => ({
      ...snippet,
      score: cosineSimilarity(queryEmbedding, embeddings[index] ?? []),
    }))
    .filter((row) => row.score >= MEMORY_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MEMORY_TOP_K);
}

/**
 * Semantic memory from past chats via /v1/embeddings.
 * ponytail: re-embeds up to 40 snippets per send (no cache). Ceiling: latency/cost on big history → IndexedDB cache.
 */
export async function buildMemoryContext(
  config: AppConfig,
  query: string,
  excludeSessionId?: string | null,
  signal?: AbortSignal,
): Promise<string> {
  const snippets = collectMemorySnippets(excludeSessionId);
  if (snippets.length === 0) {
    return "";
  }

  const vectors = await embedTexts(
    config,
    [query.trim(), ...snippets.map((snippet) => snippet.text)],
    signal,
  );
  const queryEmbedding = vectors[0];
  if (!queryEmbedding) {
    return "";
  }

  const ranked = rankMemorySnippets(queryEmbedding, snippets, vectors.slice(1));
  if (ranked.length === 0) {
    return "";
  }

  return ranked
    .map(
      (row, index) =>
        `${index + 1}. [${row.label}] (score ${row.score.toFixed(2)})\n${row.text}`,
    )
    .join("\n\n");
}
