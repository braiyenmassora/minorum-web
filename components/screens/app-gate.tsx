"use client";

import { useEffect, useState } from "react";

import { SetupScreen } from "@/components/screens/setup-screen";
import { ChatScreen } from "@/components/screens/chat-screen";
import { AppLogo } from "@/components/ui/app-logo";
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
      <main className="inset-screen flex flex-1 flex-col items-center justify-center gap-3">
        <AppLogo size={56} />
        <p className="text-token-body-medium text-text-secondary">
          {getAppCopy().internal_not_directly_shown.loading}
        </p>
      </main>
    );
  }

  if (!config) {
    return (
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <SetupScreen devDefaults={devDefaults} onComplete={setConfig} />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ChatScreen config={config} />
    </div>
  );
}
