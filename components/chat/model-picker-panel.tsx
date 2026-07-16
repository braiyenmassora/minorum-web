"use client";

import { useEffect, useMemo, useState } from "react";

import type { AppConfig } from "@/lib/core/config/app-config";
import {
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

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const entries = await fetchModelEntries(config);
        if (!cancelled) {
          setGroups(groupModelsForPicker(entries));
          setErrorMessage(null);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(messageForApiError(toChatApiError(error).kind));
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
    };
  }, [config]);

  const filtered = useMemo(() => filterGroups(groups, query), [groups, query]);
  const totalModels = filtered.reduce(
    (sum, group) => sum + group.models.length,
    0,
  );

  return (
    <div className="border-b border-border-subtle px-composer py-composer">
      {!loading && !errorMessage && groups.length > 0 ? (
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

      {!loading && !errorMessage && totalModels === 0 ? (
        <p className="px-1 py-1.5 text-token-body-medium text-text-secondary">
          {copy.empty}
        </p>
      ) : null}

      <div className="flex max-h-56 flex-col gap-2 overflow-y-auto">
        {filtered.map((group) => (
          <div key={group.category} className="flex flex-col gap-1">
            <p className="px-2 pt-1 text-token-body-medium font-bold text-white">
              {group.category}
            </p>
            {group.models.map((entry: ModelEntry) => {
              const isActive = entry.id === config.modelName;
              return (
                <button
                  key={entry.id}
                  type="button"
                  title={entry.id}
                  className={cn(
                    "flex w-full min-w-0 flex-col items-start rounded-token-sm px-2 py-2 text-left transition-colors",
                    isActive
                      ? "bg-surface-raised text-text-primary"
                      : "text-text-secondary hover:bg-surface-raised/60 hover:text-text-primary",
                  )}
                  onClick={() => onSelect(entry.id)}
                >
                  <span className="w-full truncate text-token-body-medium">
                    {getModelDisplayName(entry.id)}
                  </span>
                  <span className="w-full truncate text-token-label text-text-muted">
                    {entry.id}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
