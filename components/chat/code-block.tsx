"use client";

import { useMemo } from "react";

import { CopyIconButton } from "@/components/chat/copy-icon-button";
import { highlightWithVerminal } from "@/lib/core/themes/verminal-highlight";

import "@/app/verminal-code.css";

type CodeBlockProps = {
  code: string;
  language?: string;
};

const LANGUAGE_LABELS: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  tsx: "TSX",
  jsx: "JSX",
  py: "Python",
  python: "Python",
  sh: "Shell",
  bash: "Bash",
  zsh: "Zsh",
  json: "JSON",
  md: "Markdown",
  markdown: "Markdown",
  css: "CSS",
  html: "HTML",
  sql: "SQL",
  go: "Go",
  rust: "Rust",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  yaml: "YAML",
  yml: "YAML",
};

function formatLanguageLabel(language?: string): string {
  if (!language?.trim()) {
    return "Code";
  }
  const key = language.trim().toLowerCase();
  return LANGUAGE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function CodeBlock({ code, language }: CodeBlockProps) {
  const highlighted = useMemo(
    () => highlightWithVerminal(code, language),
    [code, language],
  );

  const languageLabel = formatLanguageLabel(language);
  const codeClass = language ? `hljs language-${language}` : "hljs";

  return (
    <div className="verminal-code">
      <div className="verminal-code__shell">
        <div className="verminal-code__header">
          <span className="verminal-code__lang">{languageLabel}</span>
          <CopyIconButton
            text={code}
            label="Copy code"
            className="verminal-code__copy"
          />
        </div>
        <pre className="verminal-code__pre">
          <code
            className={codeClass}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    </div>
  );
}
