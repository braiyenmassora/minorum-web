"use client";

import { getAppCopy } from "@/lib/core/copy/app-copy";
import {
  getStatusDefinition,
  type StatusColor,
  type SystemStatus,
} from "@/lib/services/system-status-service";
import { cn } from "@/lib/utils";

type SystemStatusIndicatorProps = {
  status: SystemStatus;
  className?: string;
};

const DOT_BY_COLOR: Record<StatusColor, string> = {
  green: "bg-[var(--color-success)] opacity-80",
  yellow: "bg-[var(--color-warning)]",
  orange: "bg-[#fa8c16]",
  red: "bg-[var(--color-error)]",
  blue: "bg-[var(--color-focus-ring)]",
};

const TEXT_BY_COLOR: Record<StatusColor, string> = {
  green: "text-text-muted",
  yellow: "text-[var(--color-warning)]",
  orange: "font-medium text-[#fa8c16]",
  red: "font-medium text-error",
  blue: "text-[var(--color-focus-ring)]",
};

export function SystemStatusIndicator({
  status,
  className,
}: SystemStatusIndicatorProps) {
  const checkingLabel = getAppCopy().system_status.checking;

  if (status === "checking") {
    return (
      <div
        className={cn("flex items-center gap-1.5", className)}
        role="status"
        aria-live="polite"
        aria-label={checkingLabel}
      >
        <span
          className="size-1.5 shrink-0 animate-pulse rounded-full bg-text-muted"
          aria-hidden
        />
        <span className="truncate text-[12px] leading-[1.35] text-text-muted">
          {checkingLabel}
        </span>
      </div>
    );
  }

  const definition = getStatusDefinition(status);

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="status"
      aria-live="polite"
      aria-label={definition.label}
    >
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          DOT_BY_COLOR[definition.color],
        )}
        aria-hidden
      />
      <span
        className={cn(
          "truncate text-[12px] leading-[1.35]",
          TEXT_BY_COLOR[definition.color],
        )}
      >
        {definition.label}
      </span>
    </div>
  );
}
