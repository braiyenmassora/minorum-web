import { getAppCopy, getErrorMessage } from "@/lib/core/copy/app-copy";
import type { ChatApiErrorKind } from "@/lib/services/chat-api-error";

const TOAST_MESSAGES_EN: Record<
  Exclude<ChatApiErrorKind, "cancelled" | "tools_rejected">,
  string
> = {
  auth: "Invalid API key or URL",
  network: "Connection lost",
  server: "Server's acting up",
  timeout: "Request timed out",
  unknown: "Something went wrong",
};

export function messageForApiError(kind: ChatApiErrorKind): string {
  if (kind === "cancelled") {
    return "";
  }

  const messages = getAppCopy().error_and_snackbar_messages;
  if (kind in messages) {
    return getErrorMessage(kind as keyof typeof messages);
  }

  return getErrorMessage("unknown");
}

/** Top toast copy — English. */
export function toastMessageForApiError(kind: ChatApiErrorKind): string {
  if (kind === "cancelled" || kind === "tools_rejected") {
    return "";
  }
  if (kind in TOAST_MESSAGES_EN) {
    return TOAST_MESSAGES_EN[kind as keyof typeof TOAST_MESSAGES_EN];
  }
  return TOAST_MESSAGES_EN.unknown;
}
