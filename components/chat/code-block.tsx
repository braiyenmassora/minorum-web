"use client";

import type { ReactNode } from "react";

import { CopyIconButton } from "@/components/chat/copy-icon-button";

type CodeBlockProps = {
  code: string;
  children: ReactNode;
};

export function CodeBlock({ code, children }: CodeBlockProps) {
  return (
    <div className="relative mb-1.5">
      <CopyIconButton
        text={code}
        label="Salin kode"
        className="absolute top-1 right-1 z-10"
      />
      <pre className="overflow-x-auto rounded-token border border-border-subtle bg-surface-raised p-2.5 pr-9 font-mono text-[0.9em]">
        {children}
      </pre>
    </div>
  );
}
