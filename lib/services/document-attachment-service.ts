/** Allowed document uploads (.pdf binary → image_url; text → inlined for API). */

const MAX_FILE_BYTES = 8 * 1024 * 1024;

const BINARY_EXTENSIONS = new Set(["pdf"]);

const TEXT_EXTENSIONS = new Set([
  "txt",
  "md",
  "markdown",
  "csv",
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
]);

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  markdown: "text/markdown",
  csv: "text/csv",
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

const ALLOWED_EXTENSIONS = new Set([
  ...BINARY_EXTENSIONS,
  ...TEXT_EXTENSIONS,
]);

export const DOCUMENT_FILE_ACCEPT = [
  ...[...ALLOWED_EXTENSIONS].map((ext) => `.${ext}`),
  "application/pdf",
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

export function isTextDocument(fileName: string, mimeType = ""): boolean {
  const ext = fileExtension(fileName);
  if (BINARY_EXTENSIONS.has(ext)) {
    return false;
  }
  if (TEXT_EXTENSIONS.has(ext)) {
    return true;
  }
  return mimeType.startsWith("text/") || mimeType === "application/json";
}

export async function prepareDocumentAttachment(
  file: File,
): Promise<PreparedDocument> {
  const ext = fileExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("Format file tidak didukung");
  }

  if (file.size > MAX_FILE_BYTES) {
    throw new Error("File terlalu besar (max 8MB)");
  }

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
