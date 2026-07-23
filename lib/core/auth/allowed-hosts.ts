const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

function normalizeHost(value: string): string {
  return value.trim().toLowerCase().split(":")[0] ?? "";
}

/** Hosts that skip the cookie gate (dev only). */
export function isLocalHost(host: string): boolean {
  return LOCAL_HOSTS.has(host) || host.endsWith(".localhost");
}

/** Production hostnames from `MINORUM_ALLOWED_HOSTS` (comma-separated). */
export function getProductionHosts(): Set<string> {
  const raw = process.env.MINORUM_ALLOWED_HOSTS?.trim();
  return new Set(
    raw
      ? raw
          .split(",")
          .map(normalizeHost)
          .filter(Boolean)
      : [],
  );
}

export function isAllowedProductionHost(host: string): boolean {
  return getProductionHosts().has(host);
}
