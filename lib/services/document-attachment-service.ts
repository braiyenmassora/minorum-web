export type PreparedDocument = {
  dataUrl: string;
  fileName: string;
  mimeType: string;
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function prepareDocumentAttachment(
  file: File,
): Promise<PreparedDocument> {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  if (!isPdf) {
    throw new Error("Hanya file PDF");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File terlalu besar (max 8MB)");
  }

  const dataUrl = await readFileAsDataUrl(file);
  return {
    dataUrl,
    fileName: file.name,
    mimeType: file.type || "application/pdf",
  };
}

async function readFileAsDataUrl(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  const mime = file.type || "application/pdf";
  return `data:${mime};base64,${btoa(binary)}`;
}
