import {
  CHAT_HISTORY_LIMIT,
  titleFromMessages,
} from "@/lib/models/chat-session";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(CHAT_HISTORY_LIMIT === 30, "history limit is 30");

assert(
  titleFromMessages([
    {
      id: "1",
      role: "user",
      content: "Halo dunia yang panjang sekali sekali sekali sekali sekali",
    },
  ]).endsWith("…"),
  "title truncates",
);

assert(titleFromMessages([]) === "New chat", "empty session title");

console.log("chat-session checks passed");
