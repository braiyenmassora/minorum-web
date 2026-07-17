import assert from "node:assert/strict";

import {
  splitTextWithLinks,
  textHasAutolinkableUrl,
} from "@/lib/utils/linkify-text";

const spitif = splitTextWithLinks("cek spitif.com ya");
assert.equal(spitif.length, 3);
assert.equal(spitif[1]?.type, "link");
assert.equal(
  spitif[1]?.type === "link" ? spitif[1].href : "",
  "https://spitif.com",
);

const id = splitTextWithLinks("beli di toko.co.id/harga");
assert.equal(id[1]?.type, "link");
assert.equal(
  id[1]?.type === "link" ? id[1].href : "",
  "https://toko.co.id/harga",
);

const trailing = splitTextWithLinks("lihat https://example.com/path.");
assert.equal(trailing[1]?.type, "link");
assert.equal(
  trailing[1]?.type === "link" ? trailing[1].href : "",
  "https://example.com/path",
);

assert.equal(textHasAutolinkableUrl("spitif.com"), true);
assert.equal(textHasAutolinkableUrl("bukan url"), false);

console.log("linkify-text.check.ts ok");
