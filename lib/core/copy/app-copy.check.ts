import { getAppCopy, loadAppCopy } from "@/lib/core/copy/app-copy";
import {
  getAllSuggestionChips,
  pickRandomSuggestions,
} from "@/lib/core/suggestions/suggestion-pool";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

loadAppCopy();

const copy = getAppCopy();
assert(copy.app_meta.app_name === "Minorum", "app_meta loaded");
assert(copy.setup_screen.save.length > 0, "setup_screen loaded");

const pool = getAllSuggestionChips();
assert(pool.length >= 8, "suggestion pool has chips");

const picks = pickRandomSuggestions(3);
assert(picks.length === 3, "pick 3 suggestions");
assert(new Set(picks).size === 3, "no duplicate picks");

const overPick = pickRandomSuggestions(100);
assert(overPick.length === pool.length, "clamp to pool size");

console.log("app-copy checks passed");
