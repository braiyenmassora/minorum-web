"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { ChatScreen } from "@/components/screens/chat-screen";
import type { AppConfig } from "@/lib/core/config/app-config";
import { loadAppCopy } from "@/lib/core/copy/app-copy";
import { clearChatSessions } from "@/lib/services/chat-history-storage-service";
import { clearConfig, loadConfig } from "@/lib/services/config-storage-service";

loadAppCopy();

async function logoutAndReset(): Promise<void> {
  clearConfig();
  clearChatSessions();
  try {
    await fetch("/api/gate", { method: "DELETE" });
  } catch {
    // Still leave the app even if cookie clear fails.
  }
  window.location.replace("/welcome");
}

export function AppGate() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.has("reset")) {
        clearConfig();
        window.history.replaceState({}, "", window.location.pathname);
      }

      const loaded = loadConfig();
      if (!loaded) {
        window.location.replace("/welcome");
        return;
      }

      setConfig(loaded);
      setLoading(false);
    });
  }, []);

  if (loading || !config) {
    return (
      <main className="inset-screen flex flex-1 flex-col items-center justify-center">
        <Loader2
          className="size-8 animate-spin text-text-secondary"
          aria-label="Loading"
        />
      </main>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ChatScreen config={config} onLogout={() => void logoutAndReset()} />
    </div>
  );
}
