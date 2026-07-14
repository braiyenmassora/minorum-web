import type { Message } from "@/lib/models/message";
import { getMessageText } from "@/lib/models/message-content";

export const CHAT_HISTORY_LIMIT = 30;

export type ChatSession = {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
};

export function titleFromMessages(messages: Message[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  if (!firstUser) {
    return "New chat";
  }

  const text = getMessageText(firstUser.content).trim().replace(/\s+/g, " ");
  if (!text) {
    return "Image";
  }

  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}
