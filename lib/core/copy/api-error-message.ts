"use client";

import copyData from "@/lib/assets/copy/minorum_copy.json";
import { publishToast } from "@/lib/toast-bus";
import type { ChatApiErrorKind } from "@/lib/services/chat-api-error";

export type ErrorToastKey = keyof typeof copyData.error_and_snackbar_messages;

const ATTACHMENT_ERROR_BY_MESSAGE: Record<string, ErrorToastKey> = {
  "Unsupported file type": "unsupported_file",
  "File too large (max 8MB)": "file_too_large",
  "Not an image file": "not_an_image",
};

function errorMessage(key: ErrorToastKey): string {
  return copyData.error_and_snackbar_messages[key];
}

export function toastMessageForApiError(kind: ChatApiErrorKind): string {
  if (kind === "cancelled" || kind === "tools_rejected") {
    return "";
  }
  if (kind in copyData.error_and_snackbar_messages) {
    return errorMessage(kind as ErrorToastKey);
  }
  return errorMessage("unknown");
}

export function toastMessageForAttachmentError(error: unknown): string {
  if (error instanceof Error) {
    const mapped = ATTACHMENT_ERROR_BY_MESSAGE[error.message.trim()];
    if (mapped) {
      return errorMessage(mapped);
    }
  }
  return errorMessage("unknown");
}

export function showErrorToast(key: ErrorToastKey): void {
  publishToast(errorMessage(key));
}

export function showApiErrorToast(kind: ChatApiErrorKind): void {
  const message = toastMessageForApiError(kind);
  if (message) {
    publishToast(message);
  }
}

export function showAttachmentErrorToast(error: unknown): void {
  publishToast(toastMessageForAttachmentError(error));
}
