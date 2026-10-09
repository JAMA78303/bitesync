"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useIsClient } from "@/lib/hooks/useIsClient";

/**
 * Light/dark switch shared by the homepage nav and the app's top bar: a pill
 * track with a sun and a moon, and a knob that slides to the active side and
 * carries that side's icon. The state reads from position and icon, not
 * colour alone.
 */
export function ThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsClient();
  // Same-size placeholder until the theme is known, so nothing shifts.
  if (!mounted) return <span className="theme-switch" aria-hidden />;

  const dark = resolvedTheme === "dark";
  const action = dark ? "Switch to light mode" : "Switch to dark mode";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={action}
      className="theme-switch"
      data-dark={dark}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      <Sun className="theme-switch-icon theme-switch-icon--sun" aria-hidden />
      <Moon className="theme-switch-icon theme-switch-icon--moon" aria-hidden />
      <span className="theme-switch-knob" aria-hidden>
        {dark ? <Moon /> : <Sun />}
      </span>
    </button>
  );
}
