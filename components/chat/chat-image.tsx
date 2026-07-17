import { cn } from "@/lib/utils";

type ChatImageProps = {
  src: string;
  alt?: string;
  size?: "preview" | "bubble";
  className?: string;
};

export function ChatImage({
  src,
  alt = "",
  size = "bubble",
  className,
}: ChatImageProps) {
  const dimension =
    size === "preview"
      ? "var(--chat-attachment-preview)"
      : "var(--chat-image-bubble)";

  return (
    // Base64/data URLs from chat attachments — next/image tidak cocok di sini.
    // eslint-disable-next-line @next/next/no-img-element -- vision preview uses data URLs
    <img
      src={src}
      alt={alt}
      className={cn("rounded-token object-cover", className)}
      style={{ width: dimension, height: dimension }}
    />
  );
}
