export type ChatApiErrorKind =
  | "auth"
  | "network"
  | "server"
  | "timeout"
  | "cancelled"
  | "tools_rejected"
  | "payload_too_large"
  | "unknown";

const USER_MESSAGES: Record<ChatApiErrorKind, string> = {
  auth: "Invalid API key or URL",
  network: "Connection lost",
  server: "Server's acting up",
  timeout: "Request timed out",
  cancelled: "",
  tools_rejected: "",
  payload_too_large: "Request too large — try a smaller file",
  unknown: "Something went wrong",
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
  if (status === 413) {
    return "payload_too_large";
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

export function isToolsRejectedError(error: unknown): boolean {
  return error instanceof ChatApiError && error.kind === "tools_rejected";
}

export function toChatApiError(error: unknown): ChatApiError {
  if (error instanceof ChatApiError) {
    return error;
  }
  return new ChatApiError(classifyFetchError(error));
}
