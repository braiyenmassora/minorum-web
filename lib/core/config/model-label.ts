export type ModelEntry = {
  id: string;
  ownedBy?: string;
};

export function getModelDisplayName(modelName: string): string {
  const trimmed = modelName.trim();
  if (!trimmed) {
    return "Select model";
  }
  const segments = trimmed.split("/");
  return segments[segments.length - 1] || trimmed;
}

/** Slow / empty-stream prone — skip when picking an automatic default. */
const AVOID_AS_DEFAULT = new Set([
  "auto/best-coding",
  "auto/best-reasoning",
  "auto/pro-coding",
  "auto/pro-reasoning",
]);

export function isComboModelId(
  id: string,
  comboIds: readonly string[] = [],
): boolean {
  return comboIds.includes(id) || id === "auto" || id.startsWith("auto/");
}

/** Prefer env override; else DealWithSign / first combo; else first manual model. */
export function pickDefaultModel(
  models: string[],
  preferred?: string,
  comboIds: string[] = [],
): string | undefined {
  const pref = preferred?.trim();
  if (pref && models.includes(pref)) {
    return pref;
  }

  if (models.includes("DealWithSign")) {
    return "DealWithSign";
  }

  const firstCombo = comboIds.find((id) => models.includes(id));
  if (firstCombo) {
    return firstCombo;
  }

  return models.find((id) => !AVOID_AS_DEFAULT.has(id)) ?? models[0];
}

/** Keep current model if still listed; otherwise pick a safe default. */
export function resolveModelSelection(
  current: string,
  models: string[],
  preferred?: string,
  comboIds: string[] = [],
): string | undefined {
  if (models.length === 0) {
    return undefined;
  }

  const trimmed = current.trim();
  if (trimmed && models.includes(trimmed)) {
    return trimmed;
  }

  return pickDefaultModel(models, preferred, comboIds);
}

/** Combos first, then the rest (legacy flat list helpers). */
export function sortModelsForDisplay(
  models: string[],
  comboIds: string[] = [],
): string[] {
  const combos = models.filter((id) => isComboModelId(id, comboIds));
  const rest = models.filter((id) => !isComboModelId(id, comboIds));
  return [...combos, ...rest];
}

export function comboIdsFromEntries(entries: ModelEntry[]): string[] {
  return entries
    .filter(
      (entry) =>
        entry.ownedBy === "combo" ||
        entry.id === "auto" ||
        entry.id.startsWith("auto/"),
    )
    .map((entry) => entry.id);
}

const PROVIDER_LABELS: Record<string, string> = {
  openrouter: "OpenRouter",
  nvidia: "Nvidia",
  cf: "Cloudflare",
  ollama: "Ollama",
  cu: "CU",
  gemini: "Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic",
  groq: "Groq",
  deepseek: "DeepSeek",
  combo: "Combo",
};

/** Category shown in the model picker (from owned_by, else id prefix). */
export function getProviderCategory(entry: ModelEntry): string {
  const owned = entry.ownedBy?.trim();
  if (
    owned === "combo" ||
    entry.id === "auto" ||
    entry.id.startsWith("auto/")
  ) {
    return "Combo";
  }
  if (owned) {
    return PROVIDER_LABELS[owned] ?? owned;
  }
  const prefix = entry.id.split("/")[0]?.trim() || "Other";
  if (prefix === entry.id) {
    return "Other";
  }
  return PROVIDER_LABELS[prefix] ?? prefix;
}

export type ModelPickerGroup = {
  category: string;
  models: ModelEntry[];
};

/** Group models by provider; Combo section pinned at the top. */
export function groupModelsForPicker(
  entries: ModelEntry[],
): ModelPickerGroup[] {
  const buckets = new Map<string, ModelEntry[]>();

  for (const entry of entries) {
    const category = getProviderCategory(entry);
    const list = buckets.get(category) ?? [];
    list.push(entry);
    buckets.set(category, list);
  }

  const groups = [...buckets.entries()].map(([category, models]) => ({
    category,
    models: [...models].sort((a, b) =>
      getModelDisplayName(a.id).localeCompare(getModelDisplayName(b.id)),
    ),
  }));

  groups.sort((a, b) => {
    if (a.category === "Combo") {
      return -1;
    }
    if (b.category === "Combo") {
      return 1;
    }
    return a.category.localeCompare(b.category);
  });

  return groups;
}
