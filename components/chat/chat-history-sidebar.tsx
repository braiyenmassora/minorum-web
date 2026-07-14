"use client";

import { Eraser, Plus, Trash2, UserRound } from "lucide-react";

import { AppLogo } from "@/components/ui/app-logo";
import { SystemStatusIndicator } from "@/components/chat/system-status-indicator";
import type { ChatSession } from "@/lib/models/chat-session";
import { getAppCopy } from "@/lib/core/copy/app-copy";
import type { SystemStatus } from "@/lib/services/system-status-service";
import { cn } from "@/lib/utils";

type ChatHistorySidebarProps = {
  sessions: ChatSession[];
  activeSessionId: string | null;
  accountName?: string;
  systemStatus: SystemStatus;
  onNewChat: () => void;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onClearAll: () => void;
  onManageAccount: () => void;
};

export function ChatHistorySidebar({
  sessions,
  activeSessionId,
  accountName,
  systemStatus,
  onNewChat,
  onSelect,
  onDelete,
  onClearAll,
  onManageAccount,
}: ChatHistorySidebarProps) {
  const copy = getAppCopy().chat_history_sidebar;

  return (
    <aside
      className="flex h-full w-[280px] shrink-0 flex-col border-r border-border-subtle bg-background"
      aria-label={copy.title}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-composer py-composer">
        <div className="flex min-w-0 items-center gap-2">
          <AppLogo size={24} className="shrink-0 rounded-full" />
          <h2 className="truncate text-token-body font-medium text-text-primary">
            {copy.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-error disabled:opacity-40"
            onClick={onClearAll}
            disabled={sessions.length === 0}
            aria-label={copy.clear_all}
            title={copy.clear_all}
          >
            <Eraser className="size-4" />
          </button>
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
            onClick={onNewChat}
            aria-label={copy.new_chat}
            title={copy.new_chat}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {sessions.length === 0 ? (
          <p className="px-2 py-4 text-center text-token-body-medium text-text-muted">
            {copy.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <li key={session.id} className="group relative">
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-token-sm px-2 py-2 pr-9 text-left text-token-body-medium transition-colors",
                      isActive
                        ? "bg-surface-raised text-text-primary"
                        : "text-text-secondary hover:bg-surface-raised/60 hover:text-text-primary",
                    )}
                    onClick={() => onSelect(session.id)}
                  >
                    <span className="line-clamp-2">{session.title}</span>
                  </button>
                  <button
                    type="button"
                    className="absolute top-1/2 right-1 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-token-sm text-text-muted opacity-70 transition-opacity hover:bg-surface-raised hover:text-error focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(session.id);
                    }}
                    aria-label={copy.delete}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-border-subtle p-2">
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-token-sm px-2 py-2 text-left transition-colors hover:bg-surface-raised"
          onClick={onManageAccount}
        >
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-text-secondary">
            <UserRound className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-token-body font-medium text-text-primary">
              {accountName?.trim() || copy.account}
            </span>
            <SystemStatusIndicator status={systemStatus} className="mt-0.5" />
          </span>
        </button>
      </div>
    </aside>
  );
}
