"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";

import { AppLogo } from "@/components/ui/app-logo";
import type { AppConfig } from "@/lib/core/config/app-config";
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
  initialConfig?: AppConfig;
  onComplete: (config: ReturnType<typeof validateAppConfig>) => void;
  onCancel?: () => void;
};

const inputClassName =
  "h-10 w-full min-w-0 rounded-token-sm border border-border-subtle bg-background px-3 text-token-body-medium text-text-primary outline-none placeholder:text-text-muted focus-visible:border-sidebar-border";

const outlineButtonClassName =
  "inline-flex h-8 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-token-sm border border-border-subtle text-token-body-medium text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary disabled:opacity-50";

const primaryButtonClassName =
  "inline-flex h-8 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-token-sm bg-user-bubble text-token-body-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50";

export function SetupScreen({
  devDefaults,
  initialConfig,
  onComplete,
  onCancel,
}: SetupScreenProps) {
  const copy = getAppCopy().setup_screen;

  const [apiBaseUrl, setApiBaseUrl] = useState(
    initialConfig?.apiBaseUrl ?? devDefaults?.apiBaseUrl ?? "",
  );
  const [apiKey, setApiKey] = useState(
    initialConfig?.apiKey ?? devDefaults?.apiKey ?? "",
  );
  const [modelName, setModelName] = useState(
    initialConfig?.modelName ?? devDefaults?.modelName ?? "",
  );
  const [fullName, setFullName] = useState(initialConfig?.fullName ?? "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPassed, setTestPassed] = useState(Boolean(initialConfig));
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
      const config = validateAppConfig({
        apiBaseUrl,
        apiKey,
        modelName,
        fullName,
      });
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
      const config = validateAppConfig({
        apiBaseUrl,
        apiKey,
        modelName,
        fullName,
      });
      if (!config.fullName) {
        setErrorMessage(getErrorMessage("profile_required"));
        return;
      }
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

  const statusMessage = errorMessage ?? successMessage;

  return (
    <main className="flex w-full min-w-0 flex-1 flex-col justify-center overflow-y-auto bg-background px-[var(--content-inset)] py-8">
      <div className="setup-form-shell flex w-full min-w-0 flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <AppLogo size={48} priority />
          <div className="flex flex-col gap-0.5">
            <h1 className="text-[20px] leading-[1.25] font-medium tracking-[-0.4px] text-text-primary">
              {copy.title}
            </h1>
            {copy.subtitle ? (
              <p className="text-token-body-medium text-text-secondary">
                {copy.subtitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-token border border-border-subtle bg-assistant-bubble shadow-floating">
          <section className="flex flex-col gap-2 border-b border-border-subtle px-3 py-3">
            <p className="text-[11px] leading-[1.35] tracking-wide text-text-muted uppercase">
              {copy.profile_section}
            </p>
            <div className="flex flex-col gap-1">
              <label
                htmlFor="full-name"
                className="text-token-label text-text-secondary"
              >
                {copy.full_name_label}
              </label>
              <input
                id="full-name"
                className={inputClassName}
                placeholder={copy.full_name_hint}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="off"
              />
            </div>
          </section>

          <section className="flex flex-col gap-2 px-3 py-3">
            <p className="text-[11px] leading-[1.35] tracking-wide text-text-muted uppercase">
              {copy.connection_section}
            </p>

            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="api-url"
                  className="text-token-label text-text-secondary"
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
                  className="text-token-label text-text-secondary"
                >
                  {copy.api_key_label}
                </label>
                <div className="flex h-10 w-full min-w-0 items-center gap-2 rounded-token-sm border border-border-subtle bg-background px-3 focus-within:border-sidebar-border">
                  <input
                    id="api-key"
                    className="min-w-0 flex-1 bg-transparent text-token-body-medium text-text-primary outline-none placeholder:text-text-muted"
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
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
                    onClick={() => setShowApiKey((value) => !value)}
                    aria-label={
                      showApiKey ? copy.hide_api_key : copy.show_api_key
                    }
                  >
                    {showApiKey ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="model-name"
                  className="text-token-label text-text-secondary"
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
          </section>

          {statusMessage ? (
            <div
              className={cn(
                "border-t border-border-subtle px-3 py-2.5 text-center text-token-label",
                errorMessage ? "text-error" : "text-success",
              )}
            >
              {statusMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-t border-border-subtle px-3 py-3">
            <div className="flex gap-2">
              <button
                type="button"
                className={outlineButtonClassName}
                onClick={() => void handleTestConnection()}
                disabled={testing}
              >
                {testing ? (
                  <Loader2
                    className="size-4 animate-spin"
                    aria-label="Loading"
                  />
                ) : (
                  copy.test_connection
                )}
              </button>
              <button
                type="button"
                className={cn(
                  primaryButtonClassName,
                  !testPassed || testing
                    ? "bg-disabled-bg text-disabled-text"
                    : undefined,
                )}
                disabled={!testPassed || testing}
                onClick={handleSave}
              >
                {copy.save}
              </button>
            </div>

            {onCancel ? (
              <button
                type="button"
                className="text-center text-token-body-medium text-text-muted transition-colors hover:text-text-primary"
                onClick={onCancel}
                disabled={testing}
              >
                {copy.cancel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
