export type AppConfig = {
  apiBaseUrl: string;
  apiKey: string;
  modelName: string;
};

export function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("API URL kosong");
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (withoutTrailingSlash.endsWith("/v1")) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/v1`;
}

export function buildModelsUrl(baseUrl: string): string {
  return `${normalizeApiBaseUrl(baseUrl)}/models`;
}

export function buildChatCompletionsUrl(baseUrl: string): string {
  return `${normalizeApiBaseUrl(baseUrl)}/chat/completions`;
}

export function validateAppConfig(input: Partial<AppConfig>): AppConfig {
  const apiBaseUrl = input.apiBaseUrl?.trim() ?? "";
  const apiKey = input.apiKey?.trim() ?? "";
  const modelName = input.modelName?.trim() ?? "";

  if (!apiBaseUrl || !apiKey || !modelName) {
    throw new Error("Config belum lengkap");
  }

  return {
    apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl),
    apiKey,
    modelName,
  };
}
