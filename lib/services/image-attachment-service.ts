export type PreparedImage = {
  dataUrl: string;
  mimeType: string;
};

const MAX_DIMENSION = 1536;
const JPEG_QUALITY = 0.85;

const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "bmp",
  "svg",
  "avif",
  "heic",
  "heif",
]);

export function isImageAttachmentFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return true;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXTENSIONS.has(ext);
}

export function scaleDimensions(
  width: number,
  height: number,
  maxDimension = MAX_DIMENSION,
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const ratio = Math.min(maxDimension / width, maxDimension / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

export async function prepareImageAttachment(
  file: File,
): Promise<PreparedImage> {
  if (!isImageAttachmentFile(file)) {
    throw new Error("Not an image file");
  }

  const bitmap = await createImageBitmap(file);
  const { width, height } = scaleDimensions(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas unavailable");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const dataUrl = canvas.toDataURL(
    mimeType,
    mimeType === "image/jpeg" ? JPEG_QUALITY : undefined,
  );

  return { dataUrl, mimeType };
}
