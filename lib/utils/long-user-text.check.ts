import { isLongUserText, USER_TEXT_PREVIEW_CHARS } from "./long-user-text";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const short = "a".repeat(100);
assert(!isLongUserText(short), "short text");

const longChars = "a".repeat(USER_TEXT_PREVIEW_CHARS + 1);
assert(isLongUserText(longChars), "long by chars");

const longLines = Array.from({ length: 8 }, (_, i) => `line ${i}`).join("\n");
assert(isLongUserText(longLines), "long by lines");

console.log("long-user-text checks passed");
