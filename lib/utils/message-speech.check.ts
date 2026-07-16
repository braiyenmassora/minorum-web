import { plainTextForSpeech } from "./message-speech";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  plainTextForSpeech("Halo **dunia**") === "Halo dunia",
  "strips bold markers",
);
assert(
  plainTextForSpeech("lihat [docs](https://x.test)") === "lihat docs",
  "keeps link label",
);
assert(
  plainTextForSpeech("kode `foo` saja") === "kode foo saja",
  "unwraps inline code",
);
assert(
  plainTextForSpeech("```\nprint(1)\n```\nok") === "ok",
  "drops fenced blocks",
);

console.log("message-speech checks passed");
