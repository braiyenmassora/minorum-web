import type { ImagePart, MessageContent, TextPart } from "@/lib/models/message";

export function buildUserMessageContent(
  text: string,
  imageDataUrl?: string | null,
): MessageContent {
  const trimmed = text.trim();
  if (!imageDataUrl) {
    return trimmed;
  }

  const parts: Array<TextPart | ImagePart> = [];
  if (trimmed) {
    parts.push({ type: "text", text: trimmed });
  }
  parts.push({
    type: "image_url",
    image_url: { url: imageDataUrl },
  });

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
