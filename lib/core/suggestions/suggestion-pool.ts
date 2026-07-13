import { getAppCopy } from "@/lib/core/copy/app-copy";

export function getAllSuggestionChips(): string[] {
  const { suggestion_chips } = getAppCopy();
  return [
    ...suggestion_chips.original_44,
    ...suggestion_chips.new_50_random_mix,
  ];
}

export function pickRandomSuggestions(count = 3): string[] {
  const pool = getAllSuggestionChips();
  if (pool.length === 0 || count <= 0) {
    return [];
  }

  const picked: string[] = [];
  const remaining = [...pool];

  while (picked.length < count && remaining.length > 0) {
    const index = Math.floor(Math.random() * remaining.length);
    picked.push(remaining[index]);
    remaining.splice(index, 1);
  }

  return picked;
}
