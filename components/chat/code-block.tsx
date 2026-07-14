"use client";

import { useMemo } from "react";

import { CopyIconButton } from "@/components/chat/copy-icon-button";
import { highlightWithVerminal } from "@/lib/core/themes/verminal-highlight";

import "@/app/verminal-code.css";

type CodeBlockProps = {
  code: string;
  language?: string;
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  const highlighted = useMemo(
    () => highlightWithVerminal(code, language),
    [code, language],
  );

  return (
    <div className="verminal-code relative mb-1.5">
      <CopyIconButton
        text={code}
        label="Salin kode"
        className="absolute top-1 right-1 z-10"
      />
      <pre className="overflow-x-auto rounded-token border border-white/10 p-2.5 pr-9">
        <code
          className={language ? `hljs language-${language}` : "hljs"}
          dangerouslySetInnerHTML={{ __html: highlighted }}
        />
      </pre>
    </div>
  );
}
