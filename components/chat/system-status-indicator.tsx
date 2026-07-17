"use client";

import { getAppCopy } from "@/lib/core/copy/app-copy";
import {
  getStatusDefinition,
  type StatusTone,
  type SystemStatus,
} from "@/lib/services/system-status-service";
import { cn } from "@/lib/utils";

type SystemStatusIndicatorProps = {
  status: SystemStatus;
  className?: string;
};

const DOT_BY_TONE: Record<StatusTone, string> = {
  neutral: "bg-text-muted",
  success: "bg-[var(--color-success)]",
  warning: "bg-[var(--color-warning)]",
  severe: "bg-[var(--color-severe)]",
  danger: "bg-[var(--color-error)]",
  info: "bg-[var(--color-info)]",
};

const TEXT_BY_TONE: Record<StatusTone, string> = {
  neutral: "text-text-muted",
  success: "text-[var(--color-success)]",
  warning: "text-[var(--color-warning)]",
  severe: "font-medium text-[var(--color-severe)]",
  danger: "font-medium text-error",
  info: "text-[var(--color-info)]",
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
          DOT_BY_TONE[definition.tone],
        )}
        aria-hidden
      />
      <span
        className={cn(
          "truncate text-[12px] leading-[1.35]",
          TEXT_BY_TONE[definition.tone],
        )}
      >
        {definition.label}
      </span>
    </div>
  );
}
