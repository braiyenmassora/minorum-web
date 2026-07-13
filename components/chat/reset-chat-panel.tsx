import { getAppCopy } from "@/lib/core/copy/app-copy";

type ResetChatPanelProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ResetChatPanel({
  open,
  onCancel,
  onConfirm,
}: ResetChatPanelProps) {
  if (!open) {
    return null;
  }

  const copy = getAppCopy().chat_screen_reset_bottom_sheet;

  return (
    <div className="border-b border-border-subtle px-composer py-composer">
      <p className="mb-2 text-[length:var(--text-body-medium-size)] leading-snug text-text-secondary">
        {copy.body}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="h-8 flex-1 rounded-token-sm border border-border-subtle text-[length:var(--text-body-medium-size)] text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
          onClick={onCancel}
        >
          {copy.cancel}
        </button>
        <button
          type="button"
          className="h-8 flex-1 rounded-token-sm bg-accent-primary text-[length:var(--text-body-medium-size)] text-text-on-accent transition-opacity hover:opacity-90"
          onClick={onConfirm}
        >
          {copy.confirm}
        </button>
      </div>
    </div>
  );
}
