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
      content: "gimana cara scala baca data dengan spark streaming",
    },
  ]) === "gimana cara scala baca data…",
  "title caps at five words",
);

assert(
  titleFromMessages([
    {
      id: "2",
      role: "user",
      content: "how does this work",
    },
  ]) === "how does this work",
  "short title unchanged",
);

assert(titleFromMessages([]) === "New chat", "empty session title");

console.log("chat-session checks passed");
