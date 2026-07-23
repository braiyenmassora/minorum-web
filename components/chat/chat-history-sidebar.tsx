"use client";

import Image from "next/image";
import { Eraser, LogOut, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { AppLogo } from "@/components/ui/app-logo";
import { ResetChatPanel } from "@/components/chat/reset-chat-panel";
import { ThemeToggleButton } from "@/components/ui/theme-toggle-button";
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
  const [confirmingClearAll, setConfirmingClearAll] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex h-full min-h-0 w-sidebar shrink-0 flex-col self-stretch bg-background after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-px after:bg-border-subtle",
        className,
      )}
      aria-label={copy.title}
    >
      <div className="flex items-center justify-between gap-inline border-b border-border-subtle px-composer py-composer">
        <div className="flex min-w-0 items-center gap-inline">
          <AppLogo size={24} className="shrink-0 rounded-full" priority />
          <h2 className="font-geist truncate text-token-body text-text-primary">
            {copy.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-inline-2xs">
          <button
            type="button"
            className="icon-btn-responsive inline-flex items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-error disabled:opacity-40"
            onClick={() => setConfirmingClearAll(true)}
            disabled={sessions.length === 0}
            aria-label={copy.clear_all}
            title={copy.clear_all}
          >
            <Eraser className="size-4" />
          </button>
          <button
            type="button"
            className="icon-btn-responsive inline-flex items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary"
            onClick={onNewChat}
            aria-label={copy.new_chat}
            title={copy.new_chat}
          >
            <Plus className="size-4" />
          </button>
          <ThemeToggleButton />
        </div>
      </div>

      <ResetChatPanel
        open={confirmingClearAll}
        body={copy.clear_all_confirm_body}
        confirmLabel={copy.clear_all_confirm}
        cancelLabel={copy.clear_all_cancel}
        onCancel={() => setConfirmingClearAll(false)}
        onConfirm={() => {
          setConfirmingClearAll(false);
          onClearAll();
        }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-sidebar py-sidebar-scroll">
        {sessions.length === 0 ? (
          <p className="px-sidebar py-[var(--spacing-lg)] text-center text-token-body-medium text-text-muted">
            {copy.empty}
          </p>
        ) : (
          <ul className="flex flex-col gap-inline-xs">
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;

              return (
                <li key={session.id} className="group relative">
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-token-sm px-sidebar py-sidebar-item pr-9 text-left text-token-body-medium transition-colors",
                      isActive
                        ? "bg-surface-raised text-text-primary"
                        : "text-text-secondary hover:bg-surface-raised/60 hover:text-text-primary",
                    )}
                    aria-current={isActive ? "true" : undefined}
                    onClick={() => onSelect(session.id)}
                  >
                    <span className="line-clamp-2">{session.title}</span>
                  </button>
                  <button
                    type="button"
                    className="icon-btn-responsive absolute top-1/2 right-[var(--spacing-xs)] inline-flex -translate-y-1/2 items-center justify-center rounded-token-sm text-text-muted opacity-70 transition-opacity hover:bg-surface-raised hover:text-error focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
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

      <div className="border-t border-border-subtle p-sidebar-footer pb-[max(var(--spacing-sm),env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center gap-inline-xs rounded-token-sm px-sidebar py-sidebar-item">
          <div className="flex min-w-0 flex-1 items-center gap-stack-md">
            <Image
              src="/me.jpeg"
              alt={displayName}
              width={32}
              height={32}
              className="size-avatar-sm shrink-0 rounded-full object-cover"
              priority
              unoptimized
            />
            <span className="min-w-0 flex-1">
              <span className="font-geist block truncate text-token-body text-text-primary">
                {displayName}
              </span>
              <SystemStatusIndicator status={systemStatus} className="mt-0.5" />
            </span>
          </div>
          <button
            type="button"
            className="icon-btn-responsive inline-flex shrink-0 items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-error"
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
