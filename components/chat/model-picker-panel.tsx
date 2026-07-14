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
  config: AppConfig;
  onSelect: (modelName: string) => void;
};

export function ModelPickerPanel({ config, onSelect }: ModelPickerPanelProps) {
  const copy = getAppCopy().pilih_model_bottom_sheet;
  const [models, setModels] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const result = await fetchModels(config);
        if (!cancelled) {
          setModels(result);
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(messageForApiError(toChatApiError(error).kind));
          setModels([]);
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
  }, [config]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? models.filter(
        (model) =>
          model.toLowerCase().includes(q) ||
          getModelDisplayName(model).toLowerCase().includes(q),
      )
    : models;

  return (
    <div className="border-b border-border-subtle px-composer py-composer">
      {!loading && !errorMessage && models.length > 0 ? (
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.search_hint}
          aria-label={copy.search_hint}
          className="mb-2 h-8 w-full min-w-0 rounded-token-sm border border-border-subtle bg-background px-2.5 text-token-body-medium text-text-primary outline-none placeholder:text-text-muted focus-visible:border-sidebar-border"
        />
      ) : null}

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

      {!loading && !errorMessage && filtered.length === 0 ? (
        <p className="px-1 py-1.5 text-token-body-medium text-text-secondary">
          {copy.empty}
        </p>
      ) : null}

      <div className="flex max-h-44 flex-col gap-1.5 overflow-y-auto">
        {filtered.map((model) => {
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
