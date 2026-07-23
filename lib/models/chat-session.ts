import type { Message } from "@/lib/models/message";
import { getMessageText } from "@/lib/models/message-content";

export const CHAT_HISTORY_LIMIT = 30;
const TITLE_MAX_WORDS = 5;

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

  const words = text.split(" ").filter(Boolean);
  if (words.length <= TITLE_MAX_WORDS) {
    return words.join(" ");
  }
  return `${words.slice(0, TITLE_MAX_WORDS).join(" ")}…`;
}
