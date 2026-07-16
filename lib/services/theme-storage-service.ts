"use client";

import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light";

const STORAGE_KEY = "minorum_theme";
const THEME_EVENT = "minorum-theme";

function readStoredTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "dark";
}

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function useThemeMode() {
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    const sync = () => {
      const next = readStoredTheme();
      applyTheme(next);
      setThemeState(next);
    };
    sync();

    window.addEventListener("storage", sync);
    window.addEventListener(THEME_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(THEME_EVENT, sync);
    };
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    applyTheme(next);
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return { theme, setTheme, toggleTheme };
}
