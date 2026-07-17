import { shouldRetryStream } from "./chat-service";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// Transient error, nothing streamed yet, attempts remain → retry.
assert(
  shouldRetryStream(false, "network", 0, 2),
  "retry transient error before any token",
);
assert(
  shouldRetryStream(false, "server", 1, 2),
  "retry server error within attempt budget",
);
assert(
  shouldRetryStream(false, "timeout", 0, 2),
  "retry idle-timeout before any token",
);

// Already produced tokens → never retry (would duplicate the answer).
assert(
  !shouldRetryStream(true, "network", 0, 2),
  "no retry after a partial token was emitted",
);

// Non-transient / cancelled → no retry.
assert(!shouldRetryStream(false, "auth", 0, 2), "no retry on auth error");
assert(!shouldRetryStream(false, "cancelled", 0, 2), "no retry on user cancel");

// Out of attempts → no retry.
assert(
  !shouldRetryStream(false, "network", 2, 2),
  "no retry once attempts exhausted",
);

console.log("chat-service checks passed");
