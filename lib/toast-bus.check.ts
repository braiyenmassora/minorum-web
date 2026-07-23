import { publishToast, subscribeToast } from "./toast-bus";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main(): void {
  const seen: string[] = [];
  const unsubscribe = subscribeToast((message) => {
    seen.push(message);
  });

  publishToast("  hello toast  ");
  assert(seen.length === 1 && seen[0] === "hello toast", "delivers trimmed message");

  unsubscribe();
  publishToast("after unsubscribe");
  assert(seen.length === 1, "does not deliver after unsubscribe");

  publishToast("queued");
  const seenLater: string[] = [];
  subscribeToast((message) => {
    seenLater.push(message);
  });
  assert(
    seenLater.join("|") === "after unsubscribe|queued",
    "flushes pending on subscribe",
  );

  console.log("toast-bus checks passed");
}

main();
