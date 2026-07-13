import { X } from "lucide-react";

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
