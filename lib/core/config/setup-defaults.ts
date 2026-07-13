import type { AppConfig } from "@/lib/core/config/app-config";

export type SetupDefaults = Partial<
  Pick<AppConfig, "apiBaseUrl" | "apiKey" | "modelName">
>;

export function readSetupDefaultsFromEnv(): SetupDefaults {
  return {
    apiBaseUrl: process.env.MINORUM_DEFAULT_API_URL,
    apiKey: process.env.MINORUM_DEFAULT_API_KEY,
    modelName: process.env.MINORUM_DEFAULT_MODEL,
  };
}
