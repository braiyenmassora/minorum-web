import type { ReactNode } from "react";
import { X } from "lucide-react";

type ComposerPreviewShellProps = {
  children: ReactNode;
  onRemove: () => void;
  removeLabel: string;
};

/** Shared wrapper for pending image / file previews in composer. */
export function ComposerPreviewShell({
  children,
  onRemove,
  removeLabel,
}: ComposerPreviewShellProps) {
  return (
    <div className="relative w-fit shrink-0">
      {children}
      <button
        type="button"
        className="absolute -top-1.5 -right-1.5 inline-flex size-control-xs items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:opacity-90"
        onClick={onRemove}
        aria-label={removeLabel}
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
