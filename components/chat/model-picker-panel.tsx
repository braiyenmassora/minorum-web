"use client";

import { useEffect, useState } from "react";

import type { AppConfig } from "@/lib/core/config/app-config";
import { getModelDisplayName } from "@/lib/core/config/model-label";
import { messageForApiError } from "@/lib/core/copy/api-error-message";
import { getAppCopy } from "@/lib/core/copy/app-copy";
import { toChatApiError } from "@/lib/services/chat-api-error";
import { fetchModels } from "@/lib/services/chat-service";
import { cn } from "@/lib/utils";

type ModelPickerPanelProps = {
  open: boolean;
  config: AppConfig;
  onSelect: (modelName: string) => void;
};

export function ModelPickerPanel({
  open,
  config,
  onSelect,
}: ModelPickerPanelProps) {
  const copy = getAppCopy().pilih_model_bottom_sheet;
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setErrorMessage(null);
      setModels([]);

      try {
        const result = await fetchModels(config);
        if (!cancelled) {
          setModels(result);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(messageForApiError(toChatApiError(error).kind));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, config]);

  if (!open) {
    return null;
  }

  return (
    <div className="border-b border-border-subtle px-composer py-composer">
      {loading ? (
        <p className="px-1 py-1.5 text-token-body-medium text-text-secondary">
          {copy.loading}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="px-1 py-1.5 text-token-body-medium text-error">
          {errorMessage}
        </p>
      ) : null}

      {!loading && !errorMessage && models.length === 0 ? (
        <p className="px-1 py-1.5 text-token-body-medium text-text-secondary">
          {copy.empty}
        </p>
      ) : null}

      <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
        {models.map((model) => {
          const isActive = model === config.modelName;

          return (
            <button
              key={model}
              type="button"
              title={model}
              className={cn(
                "flex w-full min-w-0 items-center rounded-token-sm px-2 py-2 text-left text-token-body-medium transition-colors",
                isActive
                  ? "bg-surface-raised text-text-primary"
                  : "text-text-secondary hover:bg-surface-raised/60 hover:text-text-primary",
              )}
              onClick={() => onSelect(model)}
            >
              <span className="truncate">{getModelDisplayName(model)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
