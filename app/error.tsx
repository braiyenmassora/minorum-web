"use client";

import { useEffect } from "react";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="inset-screen flex flex-1 flex-col items-center justify-center gap-panel px-[var(--spacing-lg)] text-center">
      <h1 className="font-geist text-title-large text-text-primary">
        Something went wrong
      </h1>
      <p className="max-w-md text-token-body text-text-secondary">
        An unexpected error occurred. You can try again or reload the page.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-token bg-accent-primary px-[var(--spacing-lg)] py-sidebar-item text-token-body font-medium text-text-on-accent"
      >
        Try again
      </button>
    </main>
  );
}
