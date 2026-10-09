"use client";

import { Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { RowIcon } from "@/components/ui/RowIcon";
import { useIsClient } from "@/lib/hooks/useIsClient";

export function SettingsThemeRow() {
 const { resolvedTheme, setTheme } = useTheme();
 const mounted = useIsClient();

 if (!mounted) return null;

 const isDark = resolvedTheme ==="dark";

 return (
 <div className="flex items-center gap-3 px-4 py-3.5">
 <RowIcon Icon={Moon} />
 <span className="flex-1 text-sm font-semibold text-[var(--text-primary)]">Dark mode</span>
 <button
 type="button"
 onClick={() => setTheme(isDark ?"light" :"dark")}
 className={`relative h-6 w-11 rounded-full transition-colors ${isDark ?"bg-[var(--btn-primary-bg)]" :"bg-[var(--border-default)]"}`}
 role="switch"
 aria-checked={isDark}
 aria-label="Dark mode"
 >
 <span
 className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
 isDark ?"translate-x-5" :"translate-x-0"
 }`}
 />
 </button>
 </div>
 );
}
