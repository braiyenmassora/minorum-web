/** Turn agent-style tool dumps into markdown code fences. */

const TOOL_CALL_RE = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/gi;
const TOOL_RESPONSE_RE = /<tool_response>\s*([\s\S]*?)\s*<\/tool_response>/gi;

function unescapeJsonString(raw: string): string {
  try {
    return JSON.parse(`"${raw}"`) as string;
  } catch {
    return raw
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
}

function extractToolResponseContent(body: string): string | null {
  const trimmed = body.trim();

  try {
    const parsed = JSON.parse(trimmed) as { content?: unknown };
    if (typeof parsed.content === "string") {
      return parsed.content;
    }
  } catch {
    // Model often emits nearly-JSON; pull the content string field.
  }

  const strict = /"content"\s*:\s*"((?:\\.|[^"\\])*)"/.exec(trimmed);
  if (strict?.[1] != null) {
    return unescapeJsonString(strict[1]);
  }

  // Broken JSON with raw quotes inside code — take through last " before }.
  const loose = /"content"\s*:\s*"([\s\S]*)"\s*\}\s*$/.exec(trimmed);
  if (loose?.[1] != null) {
    return unescapeJsonString(loose[1]);
  }

  return null;
}

function extractPathFromToolCall(body: string): string | undefined {
  const match = /"path"\s*:\s*"((?:\\.|[^"\\])*)"/.exec(body);
  if (!match?.[1]) {
    return undefined;
  }
  return unescapeJsonString(match[1]);
}

function languageFromPath(path: string | undefined): string {
  if (!path) {
    return "";
  }
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "py":
      return "python";
    case "ts":
      return "typescript";
    case "tsx":
      return "tsx";
    case "js":
      return "javascript";
    case "jsx":
      return "jsx";
    case "json":
      return "json";
    case "md":
      return "markdown";
    case "css":
      return "css";
    case "html":
      return "html";
    case "rs":
      return "rust";
    case "go":
      return "go";
    case "sh":
    case "bash":
      return "bash";
    default:
      return "";
  }
}

function toFence(code: string, language: string): string {
  const body = code.replace(/^\n+/, "").replace(/\n+$/, "");
  const lang = language ? language : "";
  return `\n\`\`\`${lang}\n${body}\n\`\`\`\n`;
}

/**
 * Models sometimes dump `<tool_call>` / `<tool_response>` with JSON-escaped
 * source (`\\n` literals). Rewrite those into real fenced code for the UI.
 */
export function normalizeAssistantMarkdown(text: string): string {
  if (!text.includes("<tool_")) {
    return text;
  }

  const paths: string[] = [];
  let out = text.replace(TOOL_CALL_RE, (_, body: string) => {
    const path = extractPathFromToolCall(body);
    if (path) {
      paths.push(path);
    }
    return "";
  });

  let responseIndex = 0;
  out = out.replace(TOOL_RESPONSE_RE, (_, body: string) => {
    const content = extractToolResponseContent(body);
    if (content == null) {
      return _;
    }
    const path = paths[responseIndex];
    responseIndex += 1;
    return toFence(content, languageFromPath(path));
  });

  return out.replace(/\n{3,}/g, "\n\n").trim();
}
