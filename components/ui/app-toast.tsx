"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type ToastListener = (message: string) => void;

const listeners = new Set<ToastListener>();

export function showAppToast(message: string) {
  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }
  for (const listener of listeners) {
    listener(trimmed);
  }
}

export function AppToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => setMessage(null), 200);
  }, []);

  useEffect(() => {
    const listener: ToastListener = (msg) => {
      setMessage(msg);
      setVisible(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(dismiss, 4000);
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [dismiss]);

  if (!message) {
    return null;
  }

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
      )}
    >
      <div className="pointer-events-auto max-w-md rounded-token border border-border-subtle bg-surface-raised px-[var(--spacing-lg)] py-[var(--spacing-md)] text-token-body-medium text-text-primary shadow-floating">
        {message}
      </div>
    </div>,
    document.body,
  );
}
