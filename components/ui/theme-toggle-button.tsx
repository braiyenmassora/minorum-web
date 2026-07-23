"use client";

import { Moon, Sun } from "lucide-react";

import { useThemeMode } from "@/hooks/use-theme-mode";
import { cn } from "@/lib/utils";

type ThemeToggleButtonProps = {
  className?: string;
};

/** Moon in dark (tap → light); Sun in light (tap → dark). */
export function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const { theme, toggleTheme } = useThemeMode();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex icon-btn-responsive items-center justify-center rounded-token-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text-primary",
        className,
      )}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </button>
  );
}
