"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { SetupScreen } from "@/components/screens/setup-screen";
import { ChatScreen } from "@/components/screens/chat-screen";
import type { AppConfig } from "@/lib/core/config/app-config";
import { loadAppCopy } from "@/lib/core/copy/app-copy";
import type { SetupDefaults } from "@/lib/core/config/setup-defaults";
import { clearConfig, loadConfig } from "@/lib/services/config-storage-service";

loadAppCopy();

type AppGateProps = {
  devDefaults?: SetupDefaults;
};

export function AppGate({ devDefaults }: AppGateProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const params = new URLSearchParams(window.location.search);
      if (params.has("reset")) {
        clearConfig();
        window.history.replaceState({}, "", window.location.pathname);
      }

      setConfig(loadConfig());
      setLoading(false);
    });
  }, []);

  if (loading) {
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
      {config ? (
        <div
          className={
            setupOpen ? "hidden" : "flex min-h-0 w-full flex-1 flex-col"
          }
        >
          <ChatScreen
            config={config}
            onManageAccount={() => setSetupOpen(true)}
          />
        </div>
      ) : null}

      {!config || setupOpen ? (
        <SetupScreen
          devDefaults={devDefaults}
          initialConfig={config ?? undefined}
          onComplete={(next) => {
            setConfig(next);
            setSetupOpen(false);
          }}
          onCancel={config ? () => setSetupOpen(false) : undefined}
        />
      ) : null}
    </div>
  );
}
