"use client";

import Image from "next/image";
import { Eraser, LogOut, Plus, Trash2 } from "lucide-react";

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
  onLogout: () => void;
  className?: string;
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
  onLogout,
  className,
}: ChatHistorySidebarProps) {
  const copy = getAppCopy().chat_history_sidebar;
  const displayName = accountName?.trim() || copy.account;

  return (
    <aside
      className={cn(
        "relative flex h-full min-h-0 w-[280px] shrink-0 flex-col self-stretch bg-background after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-px after:bg-border-subtle",
        className,
      )}
      aria-label={copy.title}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-composer py-composer">
        <div className="flex min-w-0 items-center gap-2">
          <AppLogo size={24} className="shrink-0 rounded-full" priority />
          <h2 className="truncate text-token-body font-medium text-text-primary">
            {copy.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-error disabled:opacity-40 md:size-7"
            onClick={onClearAll}
            disabled={sessions.length === 0}
            aria-label={copy.clear_all}
            title={copy.clear_all}
          >
            <Eraser className="size-4" />
          </button>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary md:size-7"
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
                    className="absolute top-1/2 right-1 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-token-sm text-text-muted opacity-70 transition-opacity hover:bg-surface-raised hover:text-error focus-visible:opacity-100 md:size-7 md:opacity-0 md:group-hover:opacity-100"
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
        <div className="flex items-center gap-1 rounded-token-sm px-2 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Image
              src="/me.jpeg"
              alt={displayName}
              width={32}
              height={32}
              className="size-8 shrink-0 rounded-full object-cover"
              priority
              unoptimized
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-token-body font-medium text-text-primary">
                {displayName}
              </span>
              <SystemStatusIndicator status={systemStatus} className="mt-0.5" />
            </span>
          </div>
          <button
            type="button"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-error md:size-7"
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
