import { getAppCopy, getErrorMessage } from "@/lib/core/copy/app-copy";
import type { ChatApiErrorKind } from "@/lib/services/chat-api-error";

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
