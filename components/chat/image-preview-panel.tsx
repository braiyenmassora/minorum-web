import { FileText, X } from "lucide-react";

import { ChatImage } from "@/components/chat/chat-image";

type ImagePreviewPanelProps = {
  src: string;
  onRemove: () => void;
};

export function ImagePreviewPanel({ src, onRemove }: ImagePreviewPanelProps) {
  return (
    <div className="px-composer pt-composer">
      <div className="relative w-fit">
        <ChatImage src={src} size="preview" />
        <button
          type="button"
          className="absolute -top-1.5 -right-1.5 inline-flex size-7 items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:opacity-90"
          onClick={onRemove}
          aria-label="Hapus gambar"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

type DocumentPreviewPanelProps = {
  fileName: string;
  onRemove: () => void;
};

/** Pending PDF chip — visual attach only (no content extract). */
export function DocumentPreviewPanel({
  fileName,
  onRemove,
}: DocumentPreviewPanelProps) {
  return (
    <div className="px-composer pt-composer">
      <div className="relative inline-flex max-w-full items-center gap-2.5 rounded-token border border-border-subtle bg-black/40 px-3 py-2.5 pr-10">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-token-sm bg-surface-raised text-text-secondary">
          <FileText className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 truncate text-token-body-medium text-text-primary">
          {fileName}
        </span>
        <button
          type="button"
          className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
          onClick={onRemove}
          aria-label="Hapus file"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
