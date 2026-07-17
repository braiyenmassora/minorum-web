import { splitTextWithLinks } from "@/lib/utils/linkify-text";
import { cn } from "@/lib/utils";

type PlainTextWithLinksProps = {
  text: string;
  className?: string;
  linkClassName?: string;
};

export function PlainTextWithLinks({
  text,
  className,
  linkClassName,
}: PlainTextWithLinksProps) {
  const segments = splitTextWithLinks(text);

  if (segments.length === 1 && segments[0]?.type === "text") {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.type === "link" ? (
          <a
            key={`${segment.href}-${index}`}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("underline underline-offset-2", linkClassName)}
          >
            {segment.label}
          </a>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </span>
  );
}
