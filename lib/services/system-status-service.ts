import type { AppConfig } from "@/lib/core/config/app-config";
import statusCatalog from "@/lib/core/status/system_statuses.json";
import { testConnection } from "@/lib/services/chat-service";

export type StatusTone =
  "neutral" | "success" | "warning" | "severe" | "danger" | "info";

export type StatusKey =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "maintenance";

export type SystemStatus = "checking" | StatusKey;

export type StatusDefinition = {
  key: StatusKey;
  label: string;
  tone: StatusTone;
};

const VALID_KEYS: ReadonlySet<string> = new Set([
  "operational",
  "degraded_performance",
  "partial_outage",
  "major_outage",
  "maintenance",
]);

const VALID_TONES: ReadonlySet<string> = new Set([
  "neutral",
  "success",
  "warning",
  "severe",
  "danger",
  "info",
]);

/** Runtime-validated catalog so a malformed JSON entry fails loud, not silently. */
function parseCatalog(raw: unknown): StatusDefinition[] {
  if (
    typeof raw !== "object" ||
    raw === null ||
    !Array.isArray((raw as { statuses?: unknown }).statuses)
  ) {
    throw new Error("Invalid status catalog: missing statuses array");
  }

  return (raw as { statuses: unknown[] }).statuses.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new Error(`Invalid status entry at index ${index}`);
    }
    const { key, label, tone } = entry as Record<string, unknown>;
    if (typeof key !== "string" || !VALID_KEYS.has(key)) {
      throw new Error(`Invalid status key at index ${index}: ${String(key)}`);
    }
    if (typeof label !== "string" || !label) {
      throw new Error(`Invalid status label for ${key}`);
    }
    if (typeof tone !== "string" || !VALID_TONES.has(tone)) {
      throw new Error(`Invalid status tone for ${key}: ${String(tone)}`);
    }
    return { key: key as StatusKey, label, tone: tone as StatusTone };
  });
}

export const SYSTEM_STATUSES = parseCatalog(statusCatalog);

const STATUS_POLL_MS = 60_000;

const byKey = new Map(
  SYSTEM_STATUSES.map((status) => [status.key, status] as const),
);

export function getStatusDefinition(key: StatusKey): StatusDefinition {
  const found = byKey.get(key);
  if (!found) {
    throw new Error(`Unknown status key: ${key}`);
  }
  return found;
}

export function resolveProbeStatus(webOk: boolean, apiOk: boolean): StatusKey {
  if (webOk && apiOk) {
    return "operational";
  }
  if (!webOk && !apiOk) {
    return "major_outage";
  }
  if (!apiOk) {
    return "degraded_performance";
  }
  return "partial_outage";
}

/** Web `/api/time` + upstream AI models. */
export async function probeSystemStatus(
  config: AppConfig,
  signal?: AbortSignal,
): Promise<StatusKey> {
  let webOk = false;
  let apiOk = false;

  try {
    const timeResponse = await fetch("/api/time", {
      cache: "no-store",
      signal,
    });
    webOk = timeResponse.ok;
  } catch {
    webOk = false;
  }

  try {
    await testConnection(config, signal);
    apiOk = true;
  } catch {
    apiOk = false;
  }

  return resolveProbeStatus(webOk, apiOk);
}

export { STATUS_POLL_MS };
