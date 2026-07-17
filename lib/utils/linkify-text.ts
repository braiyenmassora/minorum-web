/** Common TLDs for bare-domain autolink in user messages. */
const TLD = String.raw`(?:co\.id|or\.id|ac\.id|go\.id|my\.id|web\.id|sch\.id|com|net|org|id|io|dev|app|me|xyz|info|tech|ai)`;

const URL_RE = new RegExp(
  String.raw`(?:https?:\/\/[^\s<]+)|(?:www\.[^\s<]+)|(?:\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.${TLD}(?::\d+)?(?:\/[^\s<]*)?)`,
  "gi",
);

export type TextSegment =
  | { type: "text"; value: string }
  | { type: "link"; href: string; label: string };

function trimUrlTail(url: string): string {
  return url.replace(/[.,;:!?'")\]}>]+$/g, "");
}

function toHref(url: string): string {
  const trimmed = trimUrlTail(url);
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function splitTextWithLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    const raw = match[0];
    const label = trimUrlTail(raw);
    segments.push({ type: "link", href: toHref(label), label });
    lastIndex = index + raw.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

export function textHasAutolinkableUrl(text: string): boolean {
  URL_RE.lastIndex = 0;
  return URL_RE.test(text);
}
