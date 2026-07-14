import hljs from "highlight.js/lib/common";

export function highlightWithVerminal(code: string, language?: string): string {
  if (language && hljs.getLanguage(language)) {
    return hljs.highlight(code, { language }).value;
  }

  return hljs.highlightAuto(code).value;
}
