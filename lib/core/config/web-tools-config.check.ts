import {
  detectWebToolProvider,
  looksLikeToolRejection,
  modelOnWebToolsAllowlist,
  readWebToolsConfigFromEnv,
  resolveWebToolsForModel,
  webToolsActiveForRequest,
  webToolsEligible,
} from "./web-tools-config";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const off = readWebToolsConfigFromEnv();
process.env.MINORUM_WEB_TOOLS = "1";
process.env.MINORUM_WEB_TOOLS_MODELS = "kr/claude-sonnet-4.5, cc/other";
const on = readWebToolsConfigFromEnv();
delete process.env.MINORUM_WEB_TOOLS;
delete process.env.MINORUM_WEB_TOOLS_MODELS;

assert(!off.enabled, "default off when env unset");
assert(on.enabled, "enabled from env");
assert(on.modelAllowlist.length === 2, "allowlist parsed");

assert(
  webToolsEligible("kr/claude-sonnet-4.5", on),
  "allowlisted model eligible",
);
assert(!webToolsEligible("other/model", on), "non-allowlisted blocked");

const allModels = { enabled: true, modelAllowlist: [] as string[] };
assert(
  modelOnWebToolsAllowlist("anything", allModels.modelAllowlist),
  "empty allowlist = all",
);

assert(
  detectWebToolProvider("kr/claude-sonnet-4.5") === "anthropic",
  "kr/ = anthropic",
);
assert(detectWebToolProvider("gpt-4o") === "openai", "gpt = openai");
assert(detectWebToolProvider("DealWithSign") === "none", "unknown model");

const anthropicTools = resolveWebToolsForModel("kr/claude-sonnet-4.5");
assert(
  anthropicTools?.[0]?.type === "web_search_20250305",
  "anthropic web_search schema",
);

assert(
  webToolsActiveForRequest("kr/claude-sonnet-4.5", on),
  "active when eligible + schema known",
);
assert(
  !webToolsActiveForRequest("DealWithSign", allModels),
  "inactive when provider unknown",
);

assert(
  looksLikeToolRejection(400, "unsupported tool web_search"),
  "tool rejection detected",
);
assert(
  !looksLikeToolRejection(401, "unauthorized"),
  "auth is not tool rejection",
);

console.log("web-tools-config checks passed");
