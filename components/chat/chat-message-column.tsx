import type { ReactNode } from "react";

type ChatMessageColumnProps = {
  children: ReactNode;
};

/** Lebar pesan = lebar card composer (shell penuh, tanpa inset icon). */
export function ChatMessageColumn({ children }: ChatMessageColumnProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-chat-message">
      {children}
    </div>
  );
}
