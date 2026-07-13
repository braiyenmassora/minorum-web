import {
  buildChatCompletionsUrl,
  buildModelsUrl,
  normalizeApiBaseUrl,
  validateAppConfig,
} from "./app-config";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  normalizeApiBaseUrl("https://api.example.com/") ===
    "https://api.example.com/v1",
  "trailing slash",
);
assert(
  normalizeApiBaseUrl("https://api.example.com") ===
    "https://api.example.com/v1",
  "no v1 suffix",
);
assert(
  normalizeApiBaseUrl("https://api.example.com/v1") ===
    "https://api.example.com/v1",
  "existing v1",
);
assert(
  buildModelsUrl("https://api.example.com") ===
    "https://api.example.com/v1/models",
  "models url",
);
assert(
  buildChatCompletionsUrl("https://api.example.com") ===
    "https://api.example.com/v1/chat/completions",
  "chat url",
);

let threw = false;
try {
  validateAppConfig({ apiBaseUrl: "", apiKey: "k", modelName: "m" });
} catch {
  threw = true;
}
assert(threw, "validate rejects incomplete config");

const valid = validateAppConfig({
  apiBaseUrl: "https://api.example.com/",
  apiKey: "sk-test",
  modelName: "auto",
});
assert(
  valid.apiBaseUrl === "https://api.example.com/v1",
  "validate normalizes url",
);
assert(valid.apiKey === "sk-test", "validate keeps api key");
assert(valid.modelName === "auto", "validate keeps model");

console.log("app-config checks passed");
