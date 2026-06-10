"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useIsClient } from "@/lib/hooks/useIsClient";

export function ThemeToggle() {
 const { resolvedTheme, setTheme } = useTheme();
 const mounted = useIsClient();

 if (!mounted) return null;

 const isDark = resolvedTheme ==="dark";

 function toggleTheme() {
 setTheme(isDark ?"light" :"dark");
 }

 return (
 <button
 type="button"
 onClick={toggleTheme}
 className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
 aria-label="Toggle light and dark theme"
 title="Toggle theme"
 >
 {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
 <span>{isDark ?"Light mode" :"Dark mode"}</span>
 </button>
 );
}
