export type ChatApiErrorKind =
  "auth" | "network" | "server" | "timeout" | "cancelled" | "unknown";

const USER_MESSAGES: Record<ChatApiErrorKind, string> = {
  auth: "API key/URL salah",
  network: "Koneksi putus",
  server: "Server rewel",
  timeout: "Kelamaan nunggu",
  cancelled: "",
  unknown: "Ada yang salah",
};

export class ChatApiError extends Error {
  readonly kind: ChatApiErrorKind;

  constructor(kind: ChatApiErrorKind, message?: string) {
    super(message ?? USER_MESSAGES[kind]);
    this.name = "ChatApiError";
    this.kind = kind;
  }
}

export function classifyHttpStatus(status: number): ChatApiErrorKind {
  if (status === 401 || status === 403) {
    return "auth";
  }
  if (status >= 500) {
    return "server";
  }
  return "unknown";
}

export function classifyFetchError(error: unknown): ChatApiErrorKind {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "cancelled";
  }
  if (error instanceof TypeError) {
    return "network";
  }
  return "unknown";
}

export function isRetryableKind(kind: ChatApiErrorKind): boolean {
  return kind === "network" || kind === "server" || kind === "timeout";
}

export function toChatApiError(error: unknown): ChatApiError {
  if (error instanceof ChatApiError) {
    return error;
  }
  return new ChatApiError(classifyFetchError(error));
}
