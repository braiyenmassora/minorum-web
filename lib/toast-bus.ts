/** Cross-chunk toast pub/sub — globalThis so layout + chat share one bus. */

export type ToastListener = (message: string) => void;

const LISTENERS_KEY = "__minorum_toast_listeners__";
const PENDING_KEY = "__minorum_toast_pending__";

type ToastGlobal = typeof globalThis & {
  [LISTENERS_KEY]?: Set<ToastListener>;
  [PENDING_KEY]?: string[];
};

function toastGlobal(): ToastGlobal {
  return globalThis as ToastGlobal;
}

function listeners(): Set<ToastListener> {
  const g = toastGlobal();
  if (!g[LISTENERS_KEY]) {
    g[LISTENERS_KEY] = new Set();
  }
  return g[LISTENERS_KEY];
}

function pending(): string[] {
  const g = toastGlobal();
  if (!g[PENDING_KEY]) {
    g[PENDING_KEY] = [];
  }
  return g[PENDING_KEY];
}

export function publishToast(message: string): void {
  const trimmed = message.trim();
  if (!trimmed) {
    return;
  }

  const active = listeners();
  if (active.size === 0) {
    pending().push(trimmed);
    return;
  }

  for (const listener of active) {
    listener(trimmed);
  }
}

export function subscribeToast(listener: ToastListener): () => void {
  const active = listeners();
  active.add(listener);

  const queue = pending();
  while (queue.length > 0) {
    listener(queue.shift()!);
  }

  return () => {
    active.delete(listener);
  };
}
