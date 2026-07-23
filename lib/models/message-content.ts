import type {
  FilePart,
  ImagePart,
  MessageContent,
  TextPart,
} from "@/lib/models/message";
import {
  decodeDataUrlText,
  isPdfDocument,
  isTextDocument,
} from "@/lib/services/document-attachment-service";

export function buildUserMessageContent(
  text: string,
  imageDataUrl?: string | null,
  document?: { dataUrl: string; fileName: string } | null,
): MessageContent {
  const trimmed = text.trim();
  const parts: Array<TextPart | ImagePart | FilePart> = [];

  if (trimmed) {
    parts.push({ type: "text", text: trimmed });
  }
  if (imageDataUrl) {
    parts.push({
      type: "image_url",
      image_url: { url: imageDataUrl },
    });
  }
  if (document) {
    parts.push({
      type: "file_url",
      file_url: { url: document.dataUrl, name: document.fileName },
    });
  }

  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1 && parts[0].type === "text") {
    return parts[0].text;
  }
  return parts;
}

export function getMessageText(content: MessageContent): string {
  if (typeof content === "string") {
    return content;
  }

  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function getMessageImageUrls(content: MessageContent): string[] {
  if (typeof content === "string") {
    return [];
  }

  return content
    .filter((part) => part.type === "image_url")
    .map((part) => part.image_url.url);
}

export function getMessageFiles(
  content: MessageContent,
): Array<{ url: string; name: string }> {
  if (typeof content === "string") {
    return [];
  }

  return content
    .filter((part) => part.type === "file_url")
    .map((part) => part.file_url);
}

function binaryDocumentApiText(fileName: string): string {
  return `File attached: ${fileName}\n\n(Binary document — contents are not sent to the model. Use PDF, CSV, or plain text for analysis.)`;
}

/** API: text docs → inline text; PDF → image_url; other binaries → metadata text only. */
export function toApiMessageContent(
  content: MessageContent,
): string | Array<TextPart | ImagePart> {
  if (typeof content === "string") {
    return content;
  }

  const parts: Array<TextPart | ImagePart> = [];
  for (const part of content) {
    if (part.type === "text") {
      parts.push(part);
      continue;
    }
    if (part.type === "image_url") {
      parts.push(part);
      continue;
    }
    if (isTextDocument(part.file_url.name)) {
      parts.push({
        type: "text",
        text: `File: ${part.file_url.name}\n\n${decodeDataUrlText(part.file_url.url)}`,
      });
      continue;
    }
    if (isPdfDocument(part.file_url.name)) {
      parts.push({
        type: "image_url",
        image_url: { url: part.file_url.url },
      });
      continue;
    }
    parts.push({
      type: "text",
      text: binaryDocumentApiText(part.file_url.name),
    });
  }

  if (parts.length === 0) {
    return "";
  }
  if (parts.length === 1 && parts[0].type === "text") {
    return parts[0].text;
  }
  return parts;
}
