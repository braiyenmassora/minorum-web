import {
  CHAT_HISTORY_LIMIT,
  type ChatSession,
  titleFromMessages,
} from "@/lib/models/chat-session";
import type { Message } from "@/lib/models/message";

const STORAGE_KEY = "chat_sessions";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function sortByUpdatedAt(sessions: ChatSession[]): ChatSession[] {
  return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
}

function clampSessions(sessions: ChatSession[]): ChatSession[] {
  return sortByUpdatedAt(sessions).slice(0, CHAT_HISTORY_LIMIT);
}

function readRaw(): ChatSession[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return clampSessions(
      parsed.filter(
        (item): item is ChatSession =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as ChatSession).id === "string" &&
          typeof (item as ChatSession).title === "string" &&
          typeof (item as ChatSession).updatedAt === "number" &&
          Array.isArray((item as ChatSession).messages),
      ),
    );
  } catch {
    return [];
  }
}

function writeRaw(sessions: ChatSession[]): void {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(clampSessions(sessions)));
}

export function listChatSessions(): ChatSession[] {
  return readRaw();
}

export function getChatSession(id: string): ChatSession | null {
  return readRaw().find((session) => session.id === id) ?? null;
}

export function upsertChatSession(input: {
  id: string;
  messages: Message[];
}): ChatSession | null {
  if (input.messages.length === 0) {
    return null;
  }

  const sessions = readRaw();
  const existing = sessions.find((session) => session.id === input.id);
  const next: ChatSession = {
    id: input.id,
    title: titleFromMessages(input.messages),
    updatedAt: Date.now(),
    messages: input.messages,
  };

  const updated = existing
    ? sessions.map((session) => (session.id === input.id ? next : session))
    : [next, ...sessions];

  writeRaw(updated);
  return next;
}

export function deleteChatSession(id: string): void {
  writeRaw(readRaw().filter((session) => session.id !== id));
}

export function clearChatSessions(): void {
  writeRaw([]);
}
