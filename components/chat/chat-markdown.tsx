"use client";

import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { CodeBlock } from "@/components/chat/code-block";
import { extractNodeText } from "@/lib/utils/extract-node-text";

type ChatMarkdownProps = {
  content: string;
};

function MarkdownPre({ children }: { children?: ReactNode }) {
  const code = extractNodeText(children).replace(/\n$/, "");

  return <CodeBlock code={code}>{children}</CodeBlock>;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-focus-ring underline underline-offset-2"
            >
              {children}
            </a>
          ),
          p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="mb-1 list-disc space-y-0.5 pl-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-1 list-decimal space-y-0.5 pl-4">{children}</ol>
          ),
          li: ({ children }) => <li>{children}</li>,
          code: ({ className, children }) => {
            const isBlock = Boolean(className);
            if (isBlock) {
              return <code className={className}>{children}</code>;
            }

            return (
              <code className="rounded-token-sm bg-surface-raised px-1 py-0.5 font-mono text-[0.9em]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <MarkdownPre>{children}</MarkdownPre>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
