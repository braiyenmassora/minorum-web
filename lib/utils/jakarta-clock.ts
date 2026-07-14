/** Empty-state clock — Asia/Jakarta, e.g. "Jakarta, Indonesia · pukul 12.28 WIB" */
export function formatJakartaEmptySubtitle(now = new Date()): string {
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(now)
    .replace(":", ".");

  return `Jakarta, Indonesia · pukul ${time} WIB`;
}

/**
 * Offset so `Date.now() + offset` ≈ server time.
 * Uses mid-RTT adjustment against `/api/time` (Vercel).
 */
export async function fetchServerClockOffsetMs(
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const clientSentAt = Date.now();
  const response = await fetchImpl("/api/time", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`time api ${response.status}`);
  }

  const { now: serverNow } = (await response.json()) as { now: number };
  const clientReceivedAt = Date.now();
  const rttMs = clientReceivedAt - clientSentAt;
  const serverAtReceive = serverNow + rttMs / 2;
  return serverAtReceive - clientReceivedAt;
}

export function serverAlignedNow(offsetMs: number): Date {
  return new Date(Date.now() + offsetMs);
}
