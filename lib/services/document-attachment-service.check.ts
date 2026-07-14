import {
  prepareDocumentAttachment,
  isTextDocument,
  decodeDataUrlText,
} from "./document-attachment-service";
import { toApiMessageContent } from "@/lib/models/message-content";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function main(): Promise<void> {
  const bad = new File(["hi"], "notes.exe", {
    type: "application/octet-stream",
  });
  let rejected = false;
  try {
    await prepareDocumentAttachment(bad);
  } catch {
    rejected = true;
  }
  assert(rejected, "rejects unsupported");

  const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "doc.pdf", {
    type: "application/pdf",
  });
  const preparedPdf = await prepareDocumentAttachment(pdf);
  assert(preparedPdf.fileName === "doc.pdf", "pdf name");
  assert(
    preparedPdf.dataUrl.startsWith("data:application/pdf"),
    "pdf data url",
  );
  assert(!isTextDocument(preparedPdf.fileName), "pdf not text");

  const py = new File(["print(1)\n"], "main.py", { type: "text/x-python" });
  const preparedPy = await prepareDocumentAttachment(py);
  assert(isTextDocument(preparedPy.fileName), "py is text");
  assert(decodeDataUrlText(preparedPy.dataUrl) === "print(1)\n", "py decode");

  const api = toApiMessageContent([
    {
      type: "file_url",
      file_url: { url: preparedPy.dataUrl, name: preparedPy.fileName },
    },
  ]);
  assert(typeof api === "string", "py → text string");
  assert(api.includes("print(1)"), "py body inlined");
  assert(api.includes("main.py"), "py name inlined");

  console.log("document-attachment-service checks passed");
}

void main();
