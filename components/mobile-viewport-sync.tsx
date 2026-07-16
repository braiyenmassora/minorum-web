"use client";

import { useEffect } from "react";

/**
 * Keeps the shell height in sync with the visible viewport on iOS/Android
 * so the composer stays above the soft keyboard / home indicator.
 */
export function MobileViewportSync() {
  useEffect(() => {
    const root = document.documentElement;

    const syncHeight = () => {
      const vv = window.visualViewport;
      const height = vv?.height ?? window.innerHeight;
      root.style.setProperty("--app-height", `${Math.round(height)}px`);
    };

    const syncThemeColor = () => {
      const dark = root.classList.contains("dark");
      const color = dark ? "#000000" : "#f0f2f5";
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", color);
    };

    syncHeight();
    syncThemeColor();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", syncHeight);
    vv?.addEventListener("scroll", syncHeight);
    window.addEventListener("resize", syncHeight);
    window.addEventListener("orientationchange", syncHeight);
    window.addEventListener("minorum-theme", syncThemeColor);

    const observer = new MutationObserver(syncThemeColor);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      vv?.removeEventListener("resize", syncHeight);
      vv?.removeEventListener("scroll", syncHeight);
      window.removeEventListener("resize", syncHeight);
      window.removeEventListener("orientationchange", syncHeight);
      window.removeEventListener("minorum-theme", syncThemeColor);
      observer.disconnect();
    };
  }, []);

  return null;
}
