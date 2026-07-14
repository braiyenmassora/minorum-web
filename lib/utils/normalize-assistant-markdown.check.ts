import { normalizeAssistantMarkdown } from "./normalize-assistant-markdown";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const raw = [
  "Ini filenya:",
  '<tool_call> {"name": "read-file", "parameters": {"path": "/tmp/main.py"}} </tool_call>',
  '<tool_response> {"content":"\\nimport requests\\nprint(\\"hi\\")\\n"} </tool_response>',
].join("\n");

const normalized = normalizeAssistantMarkdown(raw);

assert(normalized.includes("```python"), `missing fence: ${normalized}`);
assert(
  normalized.includes('import requests\nprint("hi")'),
  `not unescaped: ${normalized}`,
);
assert(!normalized.includes("<tool_call>"), "tool_call should be stripped");
assert(!normalized.includes("\\n"), `still escaped: ${normalized}`);

assert(normalizeAssistantMarkdown("hello") === "hello", "passthrough unbroken");

console.log("normalize-assistant-markdown checks passed");
