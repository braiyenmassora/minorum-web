/** Server/client config for optional web_search tools on chat requests. */

export type WebToolsConfig = {
  enabled: boolean;
  /** Empty = any model when enabled. Non-empty = allowlist only. */
  modelAllowlist: readonly string[];
};

export const DEFAULT_WEB_TOOLS_CONFIG: WebToolsConfig = {
  enabled: false,
  modelAllowlist: [],
};

/** Read from process.env on the server (gate route). */
export function readWebToolsConfigFromEnv(): WebToolsConfig {
  const raw = process.env.MINORUM_WEB_TOOLS?.trim().toLowerCase() ?? "";
  const enabled = raw === "1" || raw === "true" || raw === "yes";
  const modelsRaw = process.env.MINORUM_WEB_TOOLS_MODELS?.trim() ?? "";
  const modelAllowlist = modelsRaw
    ? modelsRaw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
  return { enabled, modelAllowlist };
}

export function modelOnWebToolsAllowlist(
  modelName: string,
  allowlist: readonly string[],
): boolean {
  if (allowlist.length === 0) {
    return true;
  }
  const model = modelName.trim();
  return allowlist.some((entry) => entry === model);
}

/** Gate + env enabled, and model is on allowlist (if any). */
export function webToolsEligible(
  modelName: string,
  config: WebToolsConfig,
): boolean {
  if (!config.enabled) {
    return false;
  }
  return modelOnWebToolsAllowlist(modelName, config.modelAllowlist);
}

export type WebToolProvider = "anthropic" | "openai" | "none";

/** Guess provider tool schema from model id (9Router alias conventions). */
export function detectWebToolProvider(modelName: string): WebToolProvider {
  const model = modelName.trim().toLowerCase();
  if (!model) {
    return "none";
  }
  if (
    model.includes("claude") ||
    model.startsWith("kr/") ||
    model.startsWith("cc/") ||
    model.startsWith("anthropic/")
  ) {
    return "anthropic";
  }
  if (
    model.startsWith("o") ||
    model.includes("gpt") ||
    model.startsWith("openai/")
  ) {
    return "openai";
  }
  return "none";
}

export type ChatRequestTool = Record<string, unknown>;

/** Provider-native tool definitions for the upstream (9Router translates). */
export function resolveWebToolsForModel(
  modelName: string,
): ChatRequestTool[] | null {
  switch (detectWebToolProvider(modelName)) {
    case "anthropic":
      return [{ type: "web_search_20250305", name: "web_search" }];
    case "openai":
      // OpenAI web search on chat/completions varies by proxy; use preview type
      // many routers accept. Returns null if unsupported — caller falls back.
      return [{ type: "web_search_preview" }];
    default:
      return null;
  }
}

/** True when this request will attach tools (eligible + known provider schema). */
export function webToolsActiveForRequest(
  modelName: string,
  config: WebToolsConfig,
): boolean {
  return (
    webToolsEligible(modelName, config) &&
    resolveWebToolsForModel(modelName) !== null
  );
}

/** Heuristic: upstream rejected the tools parameter — retry without tools. */
export function looksLikeToolRejection(status: number, body: string): boolean {
  if (status !== 400 && status !== 422 && status !== 501 && status !== 502) {
    return false;
  }
  const lower = body.toLowerCase();
  return (
    lower.includes("web_search") ||
    lower.includes("tool") ||
    lower.includes("unsupported")
  );
}
