import {
  getModelDisplayName,
  pickDefaultModel,
  resolveModelSelection,
  sortModelsForDisplay,
} from "./model-label";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(getModelDisplayName("auto/best-chat") === "best-chat", "display name");
assert(
  pickDefaultModel(["auto/best-coding", "auto/best-chat"]) === "auto/best-chat",
  "prefer best-chat",
);
assert(
  pickDefaultModel(
    ["auto/best-coding", "auto/pro-coding"],
    "auto/pro-coding",
  ) === "auto/pro-coding",
  "honor preferred when listed",
);
assert(
  pickDefaultModel(["auto/best-coding", "foo/bar"]) === "foo/bar",
  "skip heavy coding default",
);
assert(pickDefaultModel(["only-one"]) === "only-one", "fallback first");
assert(pickDefaultModel([]) === undefined, "empty list");

assert(
  resolveModelSelection("stale/id", ["auto/best-chat"]) === "auto/best-chat",
  "replace stale",
);
assert(
  resolveModelSelection("auto/best-chat", ["auto/best-chat", "other"]) ===
    "auto/best-chat",
  "keep valid",
);

assert(
  sortModelsForDisplay(["z", "auto/best-chat", "a"]).join(",") ===
    "auto/best-chat,z,a",
  "hoist preferred",
);

console.log("model-label checks passed");
