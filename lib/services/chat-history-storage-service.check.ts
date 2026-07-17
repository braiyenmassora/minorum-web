// The service reads `window`/`localStorage`/`DOMException` lazily (inside its
// functions), so a static import is safe as long as we install the fake
// globals before calling anything.
import {
  listChatSessions,
  upsertChatSession,
} from "./chat-history-storage-service";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// Fake storage that rejects writes holding more than `capacity` sessions,
// mimicking a QuotaExceededError from oversized attachments.
class QuotaStorage {
  private store = new Map<string, string>();
  constructor(private capacity: number) {}

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    const parsed = JSON.parse(value) as unknown[];
    if (Array.isArray(parsed) && parsed.length > this.capacity) {
      throw new DOMException("quota exceeded", "QuotaExceededError");
    }
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const globalRef = globalThis as unknown as {
  window?: unknown;
  localStorage?: unknown;
};
globalRef.window = {};
globalRef.localStorage = new QuotaStorage(2);

const msg = (text: string) => [
  { id: "m", role: "user" as const, content: text },
];

// Fills to capacity, then a third upsert must evict the oldest — not throw.
upsertChatSession({ id: "a", messages: msg("first") });
upsertChatSession({ id: "b", messages: msg("second") });
let threw = false;
try {
  upsertChatSession({ id: "c", messages: msg("third") });
} catch {
  threw = true;
}
assert(!threw, "quota-exceeded upsert must not throw");

const ids = listChatSessions().map((s) => s.id);
assert(ids.includes("c"), "newest session survives quota eviction");
assert(!ids.includes("a"), "oldest session evicted to make room");
assert(ids.length === 2, "storage stays within what quota allows");

console.log("chat-history-storage checks passed");
