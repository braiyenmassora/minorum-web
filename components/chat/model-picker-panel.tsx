"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { AppConfig } from "@/lib/core/config/app-config";
import {
  comboEntriesOnly,
  getModelDisplayName,
  groupModelsForPicker,
  type ModelEntry,
  type ModelPickerGroup,
} from "@/lib/core/config/model-label";
import { messageForApiError } from "@/lib/core/copy/api-error-message";
import { getAppCopy } from "@/lib/core/copy/app-copy";
import { toChatApiError } from "@/lib/services/chat-api-error";
import { fetchModelEntries } from "@/lib/services/chat-service";
import { cn } from "@/lib/utils";

type ModelPickerPanelProps = {
  config: AppConfig;
  onSelect: (modelName: string) => void;
};

function filterGroups(
  groups: ModelPickerGroup[],
  query: string,
): ModelPickerGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return groups;
  }

  return groups
    .map((group) => ({
      category: group.category,
      models: group.models.filter((entry) => {
        const label = getModelDisplayName(entry.id).toLowerCase();
        return (
          entry.id.toLowerCase().includes(q) ||
          label.includes(q) ||
          group.category.toLowerCase().includes(q) ||
          (entry.ownedBy?.toLowerCase().includes(q) ?? false)
        );
      }),
    }))
    .filter((group) => group.models.length > 0);
}

export function ModelPickerPanel({ config, onSelect }: ModelPickerPanelProps) {
  const copy = getAppCopy().pilih_model_bottom_sheet;
  const [groups, setGroups] = useState<ModelPickerGroup[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    void (async () => {
      try {
        const entries = await fetchModelEntries(config, controller.signal);
        if (!cancelled) {
          setGroups(groupModelsForPicker(comboEntriesOnly(entries)));
          setErrorMessage(null);
        }
      } catch (error) {
        const apiError = toChatApiError(error);
        // Aborting on unmount/reload isn't a user-facing failure.
        if (!cancelled && apiError.kind !== "cancelled") {
          setErrorMessage(messageForApiError(apiError.kind));
          setGroups([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // Only refetch on credential change or explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.apiBaseUrl, config.apiKey, reloadKey]);

  // Focus search as soon as the list is ready so keyboard users can filter.
  useEffect(() => {
    if (!loading && !errorMessage) {
      searchRef.current?.focus();
    }
  }, [loading, errorMessage]);

  const filtered = useMemo(() => filterGroups(groups, query), [groups, query]);
  const totalModels = filtered.reduce(
    (sum, group) => sum + group.models.length,
    0,
  );

  return (
    <div
      id="model-picker-panel"
      className="flex min-h-0 flex-col border-b border-border-subtle px-composer py-composer"
    >
      {!loading && !errorMessage && groups.length > 0 ? (
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.search_hint}
          aria-label={copy.search_hint}
          aria-controls="model-picker-listbox"
          className="mb-2 h-10 w-full min-w-0 shrink-0 rounded-token-sm border border-border-subtle bg-background px-2.5 text-base text-text-primary outline-none placeholder:text-text-muted focus-visible:border-sidebar-border md:h-8 md:text-token-body-medium"
        />
      ) : null}

      {loading ? (
        <p
          role="status"
          aria-live="polite"
          className="px-1 py-1.5 text-token-body-medium text-text-secondary"
        >
          {copy.loading}
        </p>
      ) : null}

      {errorMessage ? (
        <div role="alert" className="flex items-center gap-2 px-1 py-1.5">
          <p className="text-token-body-medium text-error">{errorMessage}</p>
          <button
            type="button"
            className="focus-ring shrink-0 rounded-token-sm border border-border-subtle px-2 py-0.5 text-token-label text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary"
            onClick={() => {
              setErrorMessage(null);
              setLoading(true);
              setReloadKey((key) => key + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {!loading && !errorMessage && totalModels === 0 ? (
        <p className="px-1 py-1.5 text-token-body-medium text-text-secondary">
          {copy.empty}
        </p>
      ) : null}

      <div
        id="model-picker-listbox"
        role="listbox"
        aria-label={copy.title}
        className="flex max-h-[min(40dvh,14rem)] flex-col gap-2 overflow-y-auto overscroll-contain md:max-h-56"
      >
        {filtered.map((group) => (
          <div key={group.category} className="flex flex-col gap-1">
            {group.models.map((entry: ModelEntry) => {
              const isActive = entry.id === config.modelName;
              return (
                <button
                  key={entry.id}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  title={entry.id}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-2 rounded-token-sm px-2 py-2 text-left transition-colors",
                    isActive
                      ? "bg-surface-raised text-text-primary"
                      : "text-text-secondary hover:bg-surface-raised/60 hover:text-text-primary",
                  )}
                  onClick={() => onSelect(entry.id)}
                >
                  <span className="flex min-w-0 flex-1 flex-col items-start">
                    <span className="w-full truncate text-token-body-medium">
                      {getModelDisplayName(entry.id)}
                    </span>
                    <span className="w-full truncate text-token-label text-text-muted">
                      {entry.id}
                    </span>
                  </span>
                  {isActive ? (
                    <Check
                      className="size-4 shrink-0 text-text-primary"
                      aria-hidden
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
