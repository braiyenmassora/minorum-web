import Image from "next/image";

import { cn } from "@/lib/utils";

type AppLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function AppLogo({
  size = 56,
  className,
  priority = false,
}: AppLogoProps) {
  return (
    <Image
      src="/logo.jpeg"
      alt="Minorum"
      width={size}
      height={size}
      className={cn("rounded-token object-cover", className)}
      priority={priority}
      unoptimized
    />
  );
}
