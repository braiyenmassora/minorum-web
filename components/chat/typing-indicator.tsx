export function TypingIndicator() {
  return (
    <div className="flex w-full justify-start">
      <div className="flex items-center gap-1 rounded-token border border-border-subtle bg-surface px-2.5 py-1.5">
        <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-text-muted [animation-delay:300ms]" />
      </div>
    </div>
  );
}
