import { getAppCopy } from "@/lib/core/copy/app-copy";

type ResetChatPanelProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  /** Override default reset copy (e.g. clear-all confirmation). */
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

export function ResetChatPanel({
  open,
  onCancel,
  onConfirm,
  body,
  confirmLabel,
  cancelLabel,
}: ResetChatPanelProps) {
  if (!open) {
    return null;
  }

  const copy = getAppCopy().chat_screen_reset_bottom_sheet;

  return (
    <div className="border-b border-border-subtle px-composer py-composer">
      <p className="mb-[var(--spacing-sm)] text-token-body-medium leading-snug text-text-secondary">
        {body ?? copy.body}
      </p>
      <div className="flex gap-inline">
        <button
          type="button"
          className="focus-ring h-control-compact flex-1 rounded-token-sm border border-border-subtle text-token-body-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
          onClick={onCancel}
        >
          {cancelLabel ?? copy.cancel}
        </button>
        <button
          type="button"
          className="focus-ring h-control-compact flex-1 rounded-token-sm bg-accent-primary text-token-body-medium text-text-on-accent transition-opacity hover:opacity-90"
          onClick={onConfirm}
        >
          {confirmLabel ?? copy.confirm}
        </button>
      </div>
    </div>
  );
}
