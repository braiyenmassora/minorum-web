function extractDeltaContent(payload: string): string | null {
  if (!payload || payload === "[DONE]") {
    return null;
  }

  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.delta?.content;
    return typeof content === "string" ? content : null;
  } catch {
    return null;
  }
}

export function parseSseBlock(block: string): string[] {
  const tokens: string[] = [];

  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
      continue;
    }

    const content = extractDeltaContent(trimmed.slice(5).trim());
    if (content) {
      tokens.push(content);
    }
  }

  return tokens;
}

export class ChatStreamParser {
  private buffer = "";

  push(chunk: string): string[] {
    this.buffer += chunk;
    const tokens: string[] = [];

    let boundary = this.buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 2);
      tokens.push(...parseSseBlock(block));
      boundary = this.buffer.indexOf("\n\n");
    }

    return tokens;
  }

  flush(): string[] {
    if (!this.buffer.trim()) {
      this.buffer = "";
      return [];
    }

    const tokens = parseSseBlock(this.buffer);
    this.buffer = "";
    return tokens;
  }
}
