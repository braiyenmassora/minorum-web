import { ChatStreamParser, parseSseBlock } from "./chat-stream-parser";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const sampleBlock =
  'data: {"choices":[{"delta":{"content":"Halo"}}]}\n\n' +
  'data: {"choices":[{"delta":{"content":"!"}}]}\n\n' +
  "data: [DONE]\n\n";

assert(
  parseSseBlock('data: {"choices":[{"delta":{"content":"Hi"}}]}').join("") ===
    "Hi",
  "parse single sse block",
);

const parser = new ChatStreamParser();
const first = parser.push(sampleBlock);
assert(first.join("") === "Halo!", "parser handles chunked sse");

const second = parser.flush();
assert(second.length === 0, "parser flush after complete input");

const splitParser = new ChatStreamParser();
assert(splitParser.push('data: {"choices":[{"delta":{"content":"A"}}]}\n').length === 0, "wait for block boundary");
assert(splitParser.push("\n").join("") === "A", "complete split block");

console.log("chat-stream-parser checks passed");
