import { prepareDocumentAttachment } from "./document-attachment-service";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function main(): Promise<void> {
  const bad = new File(["hi"], "notes.md", { type: "text/markdown" });
  let rejected = false;
  try {
    await prepareDocumentAttachment(bad);
  } catch {
    rejected = true;
  }
  assert(rejected, "rejects non-pdf");

  const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "doc.pdf", {
    type: "application/pdf",
  });
  const prepared = await prepareDocumentAttachment(pdf);
  assert(prepared.fileName === "doc.pdf", "name");
  assert(prepared.dataUrl.startsWith("data:"), "data url");
  console.log("document-attachment-service checks passed");
}

void main();
