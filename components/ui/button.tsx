import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-token-md border border-transparent bg-clip-padding text-token-body-medium font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-control-compact gap-stack-sm px-[var(--control-padding-x)] has-data-[icon=inline-end]:pr-[var(--spacing-sm)] has-data-[icon=inline-start]:pl-[var(--spacing-sm)]",
        xs: "h-control-2xs gap-inline-xs rounded-token-md px-sidebar text-token-label in-data-[slot=button-group]:rounded-token has-data-[icon=inline-end]:pr-[calc(var(--spacing-xs)+2px)] has-data-[icon=inline-start]:pl-[calc(var(--spacing-xs)+2px)] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-control-xs gap-inline-xs rounded-token-md px-[var(--control-padding-x)] in-data-[slot=button-group]:rounded-token has-data-[icon=inline-end]:pr-[calc(var(--spacing-xs)+2px)] has-data-[icon=inline-start]:pl-[calc(var(--spacing-xs)+2px)] [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-control-medium gap-stack-sm px-[var(--control-padding-x)] has-data-[icon=inline-end]:pr-[var(--spacing-sm)] has-data-[icon=inline-start]:pl-[var(--spacing-sm)]",
        icon: "size-control-compact",
        "icon-xs":
          "size-control-2xs rounded-token-md in-data-[slot=button-group]:rounded-token [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-control-xs rounded-token-md in-data-[slot=button-group]:rounded-token",
        "icon-lg": "size-control-medium",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
