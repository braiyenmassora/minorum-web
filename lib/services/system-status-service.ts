import type { AppConfig } from "@/lib/core/config/app-config";
import statusCatalog from "@/lib/core/status/system_statuses.json";
import { testConnection } from "@/lib/services/chat-service";

export type StatusColor = "green" | "yellow" | "orange" | "red" | "blue";

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
  color: StatusColor;
};

export const SYSTEM_STATUSES = statusCatalog.statuses as StatusDefinition[];

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
