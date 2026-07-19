import {
  comboEntriesOnly,
  getModelDisplayName,
  getProviderCategory,
  groupModelsForPicker,
  pickDefaultModel,
  resolveModelSelection,
  sortModelsForDisplay,
} from "./model-label";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(getModelDisplayName("openai/gpt-4o") === "gpt-4o", "provider model");
assert(getModelDisplayName("DealWithSign") === "DealWithSign", "combo id");

assert(
  pickDefaultModel(["openai/gpt-4o", "DealWithSign", "nvidia/x"], undefined, [
    "DealWithSign",
  ]) === "DealWithSign",
  "default to DealWithSign combo",
);
assert(
  pickDefaultModel(["a/b"], "a/b") === "a/b",
  "honor preferred when listed",
);
assert(
  pickDefaultModel(["openai/gpt-4o", "DealWithSign"], "DealWithSign", [
    "DealWithSign",
  ]) === "DealWithSign",
  "honor preferred combo",
);

assert(
  resolveModelSelection(
    "stale/id",
    ["DealWithSign", "openai/gpt-4o"],
    "DealWithSign",
    ["DealWithSign"],
  ) === "DealWithSign",
  "stale → DealWithSign",
);

assert(
  sortModelsForDisplay(
    ["openai/gpt-4o", "DealWithSign", "z/model"],
    ["DealWithSign"],
  ).join(",") === "DealWithSign,openai/gpt-4o,z/model",
  "combos first",
);

assert(
  getProviderCategory({ id: "DealWithSign", ownedBy: "combo" }) === "Combo",
  "combo category",
);
assert(
  getProviderCategory({ id: "nvidia/foo", ownedBy: "nvidia" }) === "Nvidia",
  "nvidia category",
);

const grouped = groupModelsForPicker([
  { id: "DealWithSign", ownedBy: "combo" },
  { id: "nvidia/a", ownedBy: "nvidia" },
  { id: "gemini/b", ownedBy: "gemini" },
]);
assert(grouped[0]?.category === "Combo", "combo group first");
assert(grouped[0]?.models[0]?.id === "DealWithSign", "combo listed");
assert(grouped.length === 3, "three groups");

const onlyCombos = comboEntriesOnly([
  { id: "best", ownedBy: "combo" },
  { id: "coding", ownedBy: "combo" },
  { id: "openai/gpt-5", ownedBy: "openai" },
  { id: "auto/best-chat" },
]);
assert(
  onlyCombos.map((e) => e.id).join(",") === "best,coding,auto/best-chat",
  "comboEntriesOnly keeps owned_by=combo and auto/*",
);
assert(
  groupModelsForPicker(onlyCombos).length === 1,
  "filtered picker is one Combo group",
);

console.log("model-label checks passed");
