import { toApiMessageContent } from "./message-content";

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function main(): void {
  const docxUrl = "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBA==";
  const api = toApiMessageContent([
    { type: "text", text: "apa ini" },
    {
      type: "file_url",
      file_url: { url: docxUrl, name: "project-brief.docx" },
    },
  ]);

  assert(typeof api !== "string", "docx with text → parts array");
  assert(Array.isArray(api) && api.length === 2, "docx keeps user text + stub");
  assert(api[0].type === "text" && api[0].text === "apa ini", "user text preserved");
  assert(
    api[1].type === "text" &&
      api[1].text.includes("project-brief.docx") &&
      !api[1].text.includes("UEsDBA"),
    "docx → metadata text, no base64",
  );

  const pdfApi = toApiMessageContent([
    {
      type: "file_url",
      file_url: { url: "data:application/pdf;base64,JVBERi0=", name: "doc.pdf" },
    },
  ]);
  assert(
    typeof pdfApi !== "string" &&
      pdfApi.length === 1 &&
      pdfApi[0].type === "image_url",
    "pdf still uses image_url",
  );

  console.log("message-content checks passed");
}

main();
