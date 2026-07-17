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
assert(
  splitParser.push('data: {"choices":[{"delta":{"content":"A"}}]}\n').length ===
    0,
  "wait for block boundary",
);
assert(splitParser.push("\n").join("") === "A", "complete split block");

// CRLF SSE separators (some providers/proxies emit \r\n\r\n).
const crlfParser = new ChatStreamParser();
const crlfTokens = crlfParser.push(
  'data: {"choices":[{"delta":{"content":"C"}}]}\r\n\r\n' +
    'data: {"choices":[{"delta":{"content":"R"}}]}\r\n\r\n',
);
assert(crlfTokens.join("") === "CR", "parser handles CRLF blocks");

// CRLF split across chunk boundaries must still reunite.
const crlfSplit = new ChatStreamParser();
assert(
  crlfSplit.push('data: {"choices":[{"delta":{"content":"X"}}]}\r\n\r')
    .length === 0,
  "CRLF wait for full boundary",
);
assert(crlfSplit.push("\n").join("") === "X", "CRLF completes across chunks");

console.log("chat-stream-parser checks passed");
