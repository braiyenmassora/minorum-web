import {
  cosineSimilarity,
  formatWebHits,
  looksLikeUrlOnly,
  rankMemorySnippets,
} from "./router-tools-service";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(looksLikeUrlOnly("https://example.com/path"), "url only");
assert(looksLikeUrlOnly("  http://x.test  "), "url trimmed");
assert(!looksLikeUrlOnly("lihat https://example.com"), "url mid-sentence");
assert(
  formatWebHits([
    { title: "A", url: "https://a.test", snippet: "satu" },
    { title: "B", url: "", snippet: "dua" },
  ]).includes("1. A"),
  "formats hits",
);
assert(formatWebHits([]).includes("No search"), "empty hits");

assert(cosineSimilarity([1, 0], [1, 0]) === 1, "identical vectors");
assert(cosineSimilarity([1, 0], [0, 1]) === 0, "orthogonal vectors");
assert(
  Math.abs(cosineSimilarity([1, 1], [2, 2]) - 1) < 1e-9,
  "parallel vectors",
);

const ranked = rankMemorySnippets(
  [1, 0],
  [
    { label: "a", text: "satu" },
    { label: "b", text: "dua" },
    { label: "c", text: "tiga" },
  ],
  [
    [0.99, 0.01],
    [0, 1],
    [0.8, 0.1],
  ],
);
assert(ranked[0]?.label === "a", "top match first");
assert(
  ranked.every((row) => row.score >= 0.35),
  "threshold applied",
);

console.log("router-tools checks passed");
