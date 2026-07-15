export function getModelDisplayName(modelName: string): string {
  if (!modelName.trim()) {
    return "Select model";
  }
  const segments = modelName.split("/");
  return segments[segments.length - 1] || modelName;
}

/** OmniRoute lists coding/reasoning first; some of those return empty SSE. Prefer chat. */
export const PREFERRED_MODELS = [
  "auto/best-chat",
  "auto/best-fast",
  "auto/best-coding-fast",
] as const;

/** Avoid as auto-default when preferred ids are missing (slow / empty-stream prone). */
const AVOID_AS_DEFAULT = new Set([
  "auto/best-coding",
  "auto/best-reasoning",
  "auto/pro-coding",
  "auto/pro-reasoning",
]);

export function pickDefaultModel(
  models: string[],
  preferred?: string,
): string | undefined {
  const pref = preferred?.trim();
  if (pref && models.includes(pref)) {
    return pref;
  }

  for (const id of PREFERRED_MODELS) {
    if (models.includes(id)) {
      return id;
    }
  }

  return models.find((id) => !AVOID_AS_DEFAULT.has(id)) ?? models[0];
}

/** Keep current model if still listed; otherwise pick a safe default. */
export function resolveModelSelection(
  current: string,
  models: string[],
  preferred?: string,
): string | undefined {
  if (models.length === 0) {
    return undefined;
  }

  const trimmed = current.trim();
  if (trimmed && models.includes(trimmed)) {
    return trimmed;
  }

  return pickDefaultModel(models, preferred);
}

/** Hoist preferred combos for picker UX; keep gateway order for the rest. */
export function sortModelsForDisplay(models: string[]): string[] {
  const head = PREFERRED_MODELS.filter((id) => models.includes(id));
  const headSet = new Set<string>(head);
  return [...head, ...models.filter((id) => !headSet.has(id))];
}
