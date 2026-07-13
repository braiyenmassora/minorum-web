import { X } from "lucide-react";

import { ChatImage } from "@/components/chat/chat-image";
import { getAppCopy } from "@/lib/core/copy/app-copy";

type ImagePreviewPanelProps = {
  src: string;
  onRemove: () => void;
};

export function ImagePreviewPanel({ src, onRemove }: ImagePreviewPanelProps) {
  const copy = getAppCopy().upload_gambar_bottom_sheet;

  return (
    <div className="flex items-center gap-3 border-b border-border-subtle px-composer py-composer">
      <div className="relative shrink-0">
        <ChatImage src={src} size="preview" className="rounded-token-sm" />
      </div>
      <p className="min-w-0 flex-1 truncate text-[length:var(--text-label-small-size)] text-text-muted">
        {copy.title}
      </p>
      <button
        type="button"
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-secondary"
        onClick={onRemove}
        aria-label="Hapus gambar"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
