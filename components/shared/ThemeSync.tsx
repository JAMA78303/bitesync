"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/** Keeps `data-theme` on <html> aligned with next-themes (used by CSS tokens + Tailwind dark:). */
export function ThemeSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!resolvedTheme) return;
    const root = document.documentElement;
    root.setAttribute("data-theme", resolvedTheme);
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  return null;
}
