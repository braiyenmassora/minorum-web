"use client";

import { Eye, EyeOff, Link2 } from "lucide-react";
import { useState } from "react";

import { AppLogo } from "@/components/ui/app-logo";
import { validateAppConfig } from "@/lib/core/config/app-config";
import type { SetupDefaults } from "@/lib/core/config/setup-defaults";
import { messageForApiError } from "@/lib/core/copy/api-error-message";
import { getAppCopy, getErrorMessage } from "@/lib/core/copy/app-copy";
import { toChatApiError } from "@/lib/services/chat-api-error";
import { testConnection } from "@/lib/services/chat-service";
import { saveConfig } from "@/lib/services/config-storage-service";
import { cn } from "@/lib/utils";

type SetupScreenProps = {
  devDefaults?: SetupDefaults;
  onComplete: (config: ReturnType<typeof validateAppConfig>) => void;
};

const inputClassName =
  "h-[var(--field-min-height)] w-full rounded-token border border-border-subtle bg-transparent px-3 text-token-body text-text-primary outline-none placeholder:text-text-muted focus-visible:border-focus-ring focus-visible:ring-1 focus-visible:ring-focus-ring/30 disabled:opacity-50";

const outlineButtonClassName =
  "inline-flex h-[var(--field-min-height)] flex-1 items-center justify-center gap-2 rounded-token-sm border border-border-subtle text-token-body-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary disabled:opacity-50";

const primaryButtonClassName =
  "inline-flex h-[var(--field-min-height)] flex-1 items-center justify-center rounded-token-sm bg-accent-primary text-token-body-medium text-text-on-accent transition-opacity hover:opacity-90 disabled:opacity-50";

export function SetupScreen({ devDefaults, onComplete }: SetupScreenProps) {
  const copy = getAppCopy().setup_screen;

  const [apiBaseUrl, setApiBaseUrl] = useState(devDefaults?.apiBaseUrl ?? "");
  const [apiKey, setApiKey] = useState(devDefaults?.apiKey ?? "");
  const [modelName, setModelName] = useState(devDefaults?.modelName ?? "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function invalidateTest() {
    setTestPassed(false);
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  async function handleTestConnection() {
    setTesting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const config = validateAppConfig({ apiBaseUrl, apiKey, modelName });
      await testConnection(config);
      setTestPassed(true);
      setSuccessMessage(copy.test_connection_success);
    } catch (error) {
      setTestPassed(false);
      setErrorMessage(messageForApiError(toChatApiError(error).kind));
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    if (!testPassed) {
      setErrorMessage(getErrorMessage("test_connection_required"));
      return;
    }

    try {
      const config = validateAppConfig({ apiBaseUrl, apiKey, modelName });
      saveConfig(config);
      onComplete(config);
    } catch (error) {
      setTestPassed(false);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : getErrorMessage("config_incomplete"),
      );
    }
  }

  return (
    <main className="inset-screen flex flex-1 flex-col justify-center overflow-y-auto">
      <div className="mx-auto w-full max-w-[var(--chat-max-width)]">
        <div className="overflow-hidden rounded-token border border-border-subtle bg-surface shadow-floating">
          <div className="border-b border-border-subtle px-composer py-composer">
            <div className="mb-3 flex justify-center">
              <AppLogo size={56} />
            </div>
            <h1 className="text-center text-token-title font-medium">{copy.title}</h1>
            {copy.subtitle ? (
              <p className="mt-0.5 text-token-body-medium text-text-secondary">
                {copy.subtitle}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="border-b border-border-subtle px-composer py-composer text-token-label text-error">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="border-b border-border-subtle px-composer py-composer text-token-label text-success">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-chat-message px-composer py-composer">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="api-url"
                className="text-token-label text-text-muted"
              >
                {copy.api_url_label}
              </label>
              <input
                id="api-url"
                className={inputClassName}
                placeholder={copy.api_url_hint}
                value={apiBaseUrl}
                onChange={(event) => {
                  setApiBaseUrl(event.target.value);
                  invalidateTest();
                }}
                autoComplete="off"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="api-key"
                className="text-token-label text-text-muted"
              >
                {copy.api_key_label}
              </label>
              <div className="relative">
                <input
                  id="api-key"
                  className={cn(inputClassName, "pr-10")}
                  type={showApiKey ? "text" : "password"}
                  placeholder={copy.api_key_hint}
                  value={apiKey}
                  onChange={(event) => {
                    setApiKey(event.target.value);
                    invalidateTest();
                  }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-1 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
                  onClick={() => setShowApiKey((value) => !value)}
                  aria-label={showApiKey ? copy.hide_api_key : copy.show_api_key}
                >
                  {showApiKey ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="model-name"
                className="text-token-label text-text-muted"
              >
                {copy.model_label}
              </label>
              <input
                id="model-name"
                className={inputClassName}
                placeholder={copy.model_hint}
                value={modelName}
                onChange={(event) => {
                  setModelName(event.target.value);
                  invalidateTest();
                }}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-border-subtle px-composer py-composer">
            <button
              type="button"
              className={outlineButtonClassName}
              onClick={() => void handleTestConnection()}
              disabled={testing}
            >
              <Link2 className="size-4" />
              {testing
                ? getAppCopy().internal_not_directly_shown.loading
                : copy.test_connection}
            </button>
            <button
              type="button"
              className={primaryButtonClassName}
              onClick={handleSave}
              disabled={!testPassed || testing}
            >
              {copy.save}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
