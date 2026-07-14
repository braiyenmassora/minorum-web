import {
  fetchServerClockOffsetMs,
  formatJakartaEmptySubtitle,
  serverAlignedNow,
} from "./jakarta-clock";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const sample = formatJakartaEmptySubtitle(
  new Date("2026-07-14T05:00:00.000Z"), // 12:00 WIB
);
assert(
  sample === "Jakarta, Indonesia · pukul 12.00 WIB",
  `unexpected: ${sample}`,
);

assert(serverAlignedNow(1000).getTime() - Date.now() >= 900, "offset applied");

async function checkOffset(): Promise<void> {
  const offset = await fetchServerClockOffsetMs(async () => {
    return new Response(JSON.stringify({ now: 1_000_000 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  assert(typeof offset === "number", "offset is number");
}

void checkOffset().then(() => {
  console.log("jakarta-clock checks passed");
});
