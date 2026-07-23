"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { publishToast, subscribeToast } from "@/lib/toast-bus";
import { cn } from "@/lib/utils";

export function showAppToast(message: string) {
  publishToast(message);
}

export function AppToastHost() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => setMessage(null), 200);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const listener = (msg: string) => {
      setMessage(msg);
      setVisible(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(dismiss, 4000);
    };

    return subscribeToast(listener);
  }, [dismiss]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  if (!mounted || !message) {
    return null;
  }

  return createPortal(
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[200] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] transition-all duration-200",
        visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
      )}
    >
      <div className="pointer-events-auto w-max min-w-[12rem] max-w-[min(calc(100vw-2rem),28rem)] shrink-0 rounded-token border border-border-subtle bg-surface-raised px-[var(--spacing-lg)] py-[var(--spacing-md)] text-center text-token-body-medium leading-snug whitespace-normal text-text-primary shadow-floating">
        {message}
      </div>
    </div>,
    document.body,
  );
}
