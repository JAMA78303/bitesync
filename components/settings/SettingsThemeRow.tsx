"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function SettingsThemeRow() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !resolvedTheme) return;
    document.documentElement.setAttribute("data-theme", resolvedTheme);
    localStorage.setItem("bitesync-theme", resolvedTheme);
  }, [mounted, resolvedTheme]);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="w-7 text-center text-lg">🌙</span>
      <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">Dark mode</span>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`relative h-6 w-11 rounded-full transition-colors ${isDark ? "bg-[#3a5a40]" : "bg-gray-200 dark:bg-gray-700"}`}
        aria-label="Toggle dark mode"
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            isDark ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
