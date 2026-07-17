export function TypingIndicator() {
  return (
    <div
      className="typing-indicator py-[7px]"
      role="status"
      aria-live="polite"
      aria-label="Mengetik"
    >
      <span className="typing-indicator-dot" aria-hidden />
      <span className="typing-indicator-dot" aria-hidden />
      <span className="typing-indicator-dot" aria-hidden />
    </div>
  );
}
