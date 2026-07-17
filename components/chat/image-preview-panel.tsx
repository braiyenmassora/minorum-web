import { FileText } from "lucide-react";

import { ChatImage } from "@/components/chat/chat-image";
import { ComposerPreviewShell } from "@/components/chat/composer-preview-shell";

type ImagePreviewPanelProps = {
  src: string;
  onRemove: () => void;
};

export function ImagePreviewPanel({ src, onRemove }: ImagePreviewPanelProps) {
  return (
    <ComposerPreviewShell onRemove={onRemove} removeLabel="Hapus gambar">
      <ChatImage src={src} size="preview" />
    </ComposerPreviewShell>
  );
}

type DocumentPreviewPanelProps = {
  fileName: string;
  onRemove: () => void;
};

/** Pending file chip — same square size as image preview. */
export function DocumentPreviewPanel({
  fileName,
  onRemove,
}: DocumentPreviewPanelProps) {
  return (
    <ComposerPreviewShell onRemove={onRemove} removeLabel="Hapus file">
      <div className="flex size-[var(--chat-attachment-preview)] flex-col items-center justify-center gap-1 rounded-token border border-border-subtle bg-surface px-1.5 py-1.5 text-center">
        <FileText className="size-5 shrink-0 text-text-secondary" aria-hidden />
        <span className="line-clamp-2 w-full text-[10px] leading-tight text-text-primary">
          {fileName}
        </span>
      </div>
    </ComposerPreviewShell>
  );
}
