"use client";

import { useEffect, useState } from "react";

import { SetupScreen } from "@/components/screens/setup-screen";
import { ChatScreen } from "@/components/screens/chat-screen";
import type { AppConfig } from "@/lib/core/config/app-config";
import { getAppCopy, loadAppCopy } from "@/lib/core/copy/app-copy";
import type { SetupDefaults } from "@/lib/core/config/setup-defaults";
import { clearConfig, loadConfig } from "@/lib/services/config-storage-service";

loadAppCopy();

type AppGateProps = {
  devDefaults?: SetupDefaults;
};

export function AppGate({ devDefaults }: AppGateProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
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
      <main className="flex flex-1 items-center justify-center">
        <p className="text-[length:var(--text-body-medium-size)] text-text-secondary">
          {getAppCopy().internal_not_directly_shown.loading}
        </p>
      </main>
    );
  }

  if (!config) {
    return <SetupScreen devDefaults={devDefaults} onComplete={setConfig} />;
  }

  return <ChatScreen config={config} />;
}
