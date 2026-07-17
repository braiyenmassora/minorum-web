import {
  fetchServerClockOffsetMs,
  formatGreetingTitle,
  formatJakartaEmptySubtitle,
  jakartaGreeting,
  serverAlignedNow,
} from "./jakarta-clock";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const noon = formatJakartaEmptySubtitle(
  new Date("2026-07-14T05:00:00.000Z"), // 12:00 WIB
);
assert(
  noon === "Jakarta, Indonesia · pukul 12.00 PM",
  `unexpected noon: ${noon}`,
);

const morning = formatJakartaEmptySubtitle(
  new Date("2026-07-14T01:00:00.000Z"), // 08:00 WIB
);
assert(
  morning === "Jakarta, Indonesia · pukul 08.00 AM",
  `unexpected morning: ${morning}`,
);

assert(
  jakartaGreeting(new Date("2026-07-14T01:00:00.000Z")) === "Good morning", // 08:00 WIB
  "morning greeting",
);
assert(
  jakartaGreeting(new Date("2026-07-14T05:00:00.000Z")) === "Good afternoon", // 12:00 WIB
  "afternoon greeting",
);
assert(
  jakartaGreeting(new Date("2026-07-14T16:00:00.000Z")) === "Good night", // 23:00 WIB
  "night greeting",
);
assert(
  formatGreetingTitle(
    "Braiyen Massora",
    new Date("2026-07-14T01:00:00.000Z"),
  ) === "Good morning, Braiyen",
  "greeting title with first name",
);
assert(
  formatGreetingTitle("  ", new Date("2026-07-14T01:00:00.000Z")) ===
    "Good morning",
  "greeting title without name",
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
