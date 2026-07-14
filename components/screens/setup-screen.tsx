"use client";

import { Eye, EyeOff } from "lucide-react";
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
  "h-[var(--field-min-height)] w-full min-w-0 rounded-token border border-border-subtle bg-assistant-bubble px-composer text-token-body text-text-primary outline-none placeholder:text-text-muted focus-visible:border-focus-ring focus-visible:ring-1 focus-visible:ring-focus-ring/40";

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
    <main className="inset-screen flex w-full min-w-0 flex-1 flex-col justify-center overflow-y-auto">
      <div className="screen-shell min-w-0">
        <div className="setup-form-shell flex flex-col gap-chat-message">
          <div className="flex flex-col items-center gap-chat-message text-center">
            <AppLogo size={56} priority />
            <div className="flex flex-col gap-0.5">
              <h1 className="text-token-title font-medium text-text-primary">
                {copy.title}
              </h1>
              {copy.subtitle ? (
                <p className="text-token-body-medium text-text-secondary">
                  {copy.subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-chat-message">
            <div className="flex flex-col gap-1">
              <p className="text-token-label text-text-muted">
                {copy.profile_section}
              </p>
              <label
                htmlFor="full-name"
                className="text-token-label text-text-muted"
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
              <div className="flex h-[var(--field-min-height)] w-full min-w-0 items-center gap-3 rounded-token border border-border-subtle bg-assistant-bubble px-composer focus-within:border-focus-ring focus-within:ring-1 focus-within:ring-focus-ring/40">
                <input
                  id="api-key"
                  className="min-w-0 flex-1 bg-transparent text-token-body text-text-primary outline-none placeholder:text-text-muted"
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
                  className="inline-flex size-[var(--composer-icon-size)] shrink-0 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
                  onClick={() => setShowApiKey((value) => !value)}
                  aria-label={
                    showApiKey ? copy.hide_api_key : copy.show_api_key
                  }
                >
                  {showApiKey ? (
                    <EyeOff className="size-[var(--icon-size)]" />
                  ) : (
                    <Eye className="size-[var(--icon-size)]" />
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

          {statusMessage ? (
            <p
              className={cn(
                "text-center text-token-label",
                errorMessage ? "text-error" : "text-success",
              )}
            >
              {statusMessage}
            </p>
          ) : null}

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

          <div className="flex gap-2">
            <button
              type="button"
              className={outlineButtonClassName}
              onClick={() => void handleTestConnection()}
              disabled={testing}
            >
              {testing
                ? getAppCopy().internal_not_directly_shown.loading
                : copy.test_connection}
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
        </div>
      </div>
    </main>
  );
}
