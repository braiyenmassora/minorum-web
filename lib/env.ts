import { z } from "zod";

import { normalizeApiBaseUrl } from "@/lib/core/config/app-config";

const serverEnvSchema = z.object({
  GATE_PASSWORD: z.string().min(1).optional(),
  GATE_SESSION_SECRET: z.string().min(16).optional(),
  MINORUM_DEFAULT_API_URL: z.string().min(1).optional(),
  MINORUM_DEFAULT_API_KEY: z.string().min(1).optional(),
  MINORUM_DEFAULT_MODEL: z.string().optional(),
  MINORUM_WEB_TOOLS: z.string().optional(),
  MINORUM_WEB_TOOLS_MODELS: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function readServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    GATE_PASSWORD: process.env.GATE_PASSWORD?.trim() || undefined,
    GATE_SESSION_SECRET: process.env.GATE_SESSION_SECRET?.trim() || undefined,
    MINORUM_DEFAULT_API_URL:
      process.env.MINORUM_DEFAULT_API_URL?.trim() || undefined,
    MINORUM_DEFAULT_API_KEY:
      process.env.MINORUM_DEFAULT_API_KEY?.trim() || undefined,
    MINORUM_DEFAULT_MODEL:
      process.env.MINORUM_DEFAULT_MODEL?.trim() || undefined,
    MINORUM_WEB_TOOLS: process.env.MINORUM_WEB_TOOLS?.trim() || undefined,
    MINORUM_WEB_TOOLS_MODELS:
      process.env.MINORUM_WEB_TOOLS_MODELS?.trim() || undefined,
  });
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Gate password — must be set in `.env` (local and prod). */
export function getGatePassword(): string {
  const { GATE_PASSWORD } = readServerEnv();
  if (GATE_PASSWORD) {
    return GATE_PASSWORD;
  }
  throw new Error(
    "[env] GATE_PASSWORD is required. Set it in .env and restart.",
  );
}

export type ApiDefaults = {
  apiBaseUrl: string;
  apiKey: string;
  preferredModel: string;
};

export function getApiDefaults(): ApiDefaults | null {
  const env = readServerEnv();
  const { MINORUM_DEFAULT_API_URL, MINORUM_DEFAULT_API_KEY, MINORUM_DEFAULT_MODEL } =
    env;

  if (!MINORUM_DEFAULT_API_URL || !MINORUM_DEFAULT_API_KEY) {
    console.error(
      "[env] Server API config missing — set MINORUM_DEFAULT_API_URL and MINORUM_DEFAULT_API_KEY in .env, then restart.",
      {
        hasUrl: Boolean(MINORUM_DEFAULT_API_URL),
        hasKey: Boolean(MINORUM_DEFAULT_API_KEY),
      },
    );
    return null;
  }

  try {
    return {
      apiBaseUrl: normalizeApiBaseUrl(MINORUM_DEFAULT_API_URL),
      apiKey: MINORUM_DEFAULT_API_KEY,
      preferredModel: MINORUM_DEFAULT_MODEL ?? "",
    };
  } catch {
    return null;
  }
}

export function getWebToolsEnv(): {
  rawFlag: string;
  modelsRaw: string;
} {
  const env = readServerEnv();
  return {
    rawFlag: env.MINORUM_WEB_TOOLS?.toLowerCase() ?? "",
    modelsRaw: env.MINORUM_WEB_TOOLS_MODELS ?? "",
  };
}

export function readWebToolsConfigFromEnv(): import("@/lib/core/config/web-tools-config").WebToolsConfig {
  const { rawFlag, modelsRaw } = getWebToolsEnv();
  const enabled = rawFlag === "1" || rawFlag === "true" || rawFlag === "yes";
  const modelAllowlist = modelsRaw
    ? modelsRaw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
  return { enabled, modelAllowlist };
}
