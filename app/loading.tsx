import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main
      className="inset-screen flex flex-1 flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className="size-control-compact animate-spin text-text-secondary"
        aria-hidden
      />
      <span className="sr-only">Loading</span>
    </main>
  );
}
