"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { ChatScreen } from "@/components/screens/chat-screen";
import {
  type AppConfig,
  validateAppConfig,
} from "@/lib/core/config/app-config";
import {
  DEFAULT_WEB_TOOLS_CONFIG,
  type WebToolsConfig,
} from "@/lib/core/config/web-tools-config";
import { loadAppCopy } from "@/lib/core/copy/app-copy";
import { clearChatSessions } from "@/lib/services/chat-history-storage-service";
import {
  clearConfig,
  loadConfig,
  saveConfig,
} from "@/lib/services/config-storage-service";

loadAppCopy();

async function logoutAndReset(): Promise<void> {
  clearConfig();
  clearChatSessions();
  try {
    await fetch("/api/gate", {
      method: "DELETE",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // Still leave the app even if cookie clear fails / times out.
  } finally {
    // Guaranteed redirect even if the DELETE hangs or throws.
    window.location.replace("/welcome");
  }
}

/** Pull apiBaseUrl/apiKey from server .env so localStorage doesn't keep stale credentials. */
async function syncConfigFromServer(loaded: AppConfig): Promise<{
  config: AppConfig;
  webTools: WebToolsConfig;
}> {
  try {
    const response = await fetch("/api/gate", {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return { config: loaded, webTools: DEFAULT_WEB_TOOLS_CONFIG };
    }
    const payload = (await response.json()) as {
      ok?: boolean;
      config?: {
        apiBaseUrl?: string;
        apiKey?: string;
        preferredModel?: string;
      };
      webTools?: WebToolsConfig;
    };
    if (
      payload.ok !== true ||
      !payload.config?.apiBaseUrl ||
      !payload.config.apiKey
    ) {
      return { config: loaded, webTools: DEFAULT_WEB_TOOLS_CONFIG };
    }

    const synced = validateAppConfig({
      apiBaseUrl: payload.config.apiBaseUrl,
      apiKey: payload.config.apiKey,
      modelName:
        loaded.modelName.trim() || payload.config.preferredModel?.trim() || "",
      fullName: loaded.fullName,
    });
    saveConfig(synced);
    return {
      config: synced,
      webTools: payload.webTools ?? DEFAULT_WEB_TOOLS_CONFIG,
    };
  } catch {
    return { config: loaded, webTools: DEFAULT_WEB_TOOLS_CONFIG };
  }
}

export function AppGate() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [webToolsConfig, setWebToolsConfig] = useState<WebToolsConfig>(
    DEFAULT_WEB_TOOLS_CONFIG,
  );
  const [loading, setLoading] = useState(true);

  // Show the spinner (busy) while logout runs, and avoid double-triggering it.
  const handleLogout = useCallback(() => {
    setLoading(true);
    void logoutAndReset();
  }, []);

  useEffect(() => {
    void (async () => {
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

      const { config: synced, webTools } = await syncConfigFromServer(loaded);
      setConfig(synced);
      setWebToolsConfig(webTools);
      setLoading(false);
    })();
  }, []);

  if (loading || !config) {
    return (
      <main
        className="inset-screen flex flex-1 flex-col items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2
          className="size-8 animate-spin text-text-secondary"
          aria-hidden
        />
        <span className="sr-only">Loading</span>
      </main>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <ChatScreen
        config={config}
        webToolsConfig={webToolsConfig}
        onLogout={handleLogout}
      />
    </div>
  );
}
