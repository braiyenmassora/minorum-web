/** Document uploads — text inlined for API; other binaries sent as data URLs. */

const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Never attach as documents (use image flow or block). */
const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "dll",
  "msi",
  "bat",
  "cmd",
  "com",
  "scr",
  "vbs",
  "jar",
  "app",
  "deb",
  "rpm",
  "apk",
  "dmg",
  "iso",
]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
  "tsv",
  "log",
  "json",
  "jsonc",
  "yml",
  "yaml",
  "toml",
  "ini",
  "env",
  "xml",
  "html",
  "htm",
  "css",
  "scss",
  "sql",
  "py",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "sh",
  "bash",
  "zsh",
  "rs",
  "go",
  "java",
  "kt",
  "c",
  "h",
  "cpp",
  "hpp",
  "cc",
  "cs",
  "rb",
  "php",
  "swift",
  "r",
  "lua",
  "pl",
  "proto",
  "rtf",
]);

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  ods: "application/vnd.oasis.opendocument.spreadsheet",
  odp: "application/vnd.oasis.opendocument.presentation",
  rtf: "application/rtf",
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  log: "text/plain",
  json: "application/json",
  jsonc: "application/json",
  yml: "text/yaml",
  yaml: "text/yaml",
  toml: "application/toml",
  ini: "text/plain",
  env: "text/plain",
  xml: "application/xml",
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  scss: "text/x-scss",
  sql: "application/sql",
  py: "text/x-python",
  js: "text/javascript",
  jsx: "text/javascript",
  mjs: "text/javascript",
  cjs: "text/javascript",
  ts: "text/typescript",
  tsx: "text/typescript",
  sh: "application/x-sh",
  bash: "application/x-sh",
  zsh: "application/x-sh",
  rs: "text/rust",
  go: "text/x-go",
  java: "text/x-java-source",
  kt: "text/x-kotlin",
  c: "text/x-c",
  h: "text/x-c",
  cpp: "text/x-c++",
  hpp: "text/x-c++",
  cc: "text/x-c++",
  cs: "text/x-csharp",
  rb: "text/x-ruby",
  php: "application/x-php",
  swift: "text/x-swift",
  r: "text/x-r",
  lua: "text/x-lua",
  pl: "text/x-perl",
  proto: "text/x-protobuf",
};

const DOCUMENT_EXTENSION_HINTS = [
  ...TEXT_EXTENSIONS,
  ...Object.keys(MIME_BY_EXT).filter((ext) => !TEXT_EXTENSIONS.has(ext)),
].map((ext) => `.${ext}`);

/** File picker hints — any non-image file still allowed when extension is missing but MIME is set. */
export const DOCUMENT_FILE_ACCEPT = [
  ...DOCUMENT_EXTENSION_HINTS,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "text/plain",
].join(",");

export type PreparedDocument = {
  dataUrl: string;
  fileName: string;
  mimeType: string;
};

export function fileExtension(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : "";
}

function isBlockedDocument(file: File): boolean {
  const ext = fileExtension(file.name);
  return Boolean(ext && BLOCKED_EXTENSIONS.has(ext));
}

function looksLikeDocumentMime(mimeType: string): boolean {
  if (!mimeType || mimeType.startsWith("image/")) {
    return false;
  }
  return (
    mimeType.startsWith("text/") ||
    mimeType.startsWith("application/") ||
    mimeType === "message/rfc822"
  );
}

export function isAcceptedDocumentFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return false;
  }
  if (isBlockedDocument(file)) {
    return false;
  }

  const ext = fileExtension(file.name);
  if (ext) {
    return true;
  }

  return looksLikeDocumentMime(file.type);
}

export function isTextDocument(fileName: string, mimeType = ""): boolean {
  const ext = fileExtension(fileName);
  if (TEXT_EXTENSIONS.has(ext)) {
    return true;
  }
  if (mimeType.startsWith("text/") || mimeType === "application/json") {
    return true;
  }
  return false;
}

export async function prepareDocumentAttachment(
  file: File,
): Promise<PreparedDocument> {
  if (!isAcceptedDocumentFile(file)) {
    throw new Error("Unsupported file type");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File too large (max 8MB)");
  }

  const ext = fileExtension(file.name);
  const mimeType = file.type || MIME_BY_EXT[ext] || "application/octet-stream";

  if (isTextDocument(file.name, mimeType)) {
    const text = await file.text();
    return {
      dataUrl: encodeTextDataUrl(text, mimeType),
      fileName: file.name,
      mimeType,
    };
  }

  return {
    dataUrl: await readBytesAsDataUrl(file, mimeType),
    fileName: file.name,
    mimeType,
  };
}

export function decodeDataUrlText(dataUrl: string): string {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) {
    throw new Error("Invalid data URL");
  }
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function encodeTextDataUrl(text: string, mimeType: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

async function readBytesAsDataUrl(
  file: File,
  mimeType: string,
): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}
