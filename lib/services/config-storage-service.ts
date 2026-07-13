import {
  type AppConfig,
  validateAppConfig,
} from "@/lib/core/config/app-config";

const STORAGE_KEYS = {
  apiBaseUrl: "api_base_url",
  apiKey: "api_key",
  modelName: "model_name",
} as const;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function loadConfig(): AppConfig | null {
  if (!isBrowser()) {
    return null;
  }

  const apiBaseUrl = localStorage.getItem(STORAGE_KEYS.apiBaseUrl);
  const apiKey = localStorage.getItem(STORAGE_KEYS.apiKey);
  const modelName = localStorage.getItem(STORAGE_KEYS.modelName);

  if (!apiBaseUrl || !apiKey || !modelName) {
    return null;
  }

  try {
    return validateAppConfig({ apiBaseUrl, apiKey, modelName });
  } catch {
    return null;
  }
}

export function saveConfig(config: AppConfig): void {
  if (!isBrowser()) {
    throw new Error("localStorage tidak tersedia");
  }

  const valid = validateAppConfig(config);
  localStorage.setItem(STORAGE_KEYS.apiBaseUrl, valid.apiBaseUrl);
  localStorage.setItem(STORAGE_KEYS.apiKey, valid.apiKey);
  localStorage.setItem(STORAGE_KEYS.modelName, valid.modelName);
}

export function updateConfigModel(
  config: AppConfig,
  modelName: string,
): AppConfig {
  const updated = validateAppConfig({ ...config, modelName });
  saveConfig(updated);
  return updated;
}

export function clearConfig(): void {
  if (!isBrowser()) {
    return;
  }

  for (const key of Object.values(STORAGE_KEYS)) {
    localStorage.removeItem(key);
  }
}
