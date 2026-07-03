"use client";

import type { ReactNode } from "react";
import {
  SCREENSHOT_CROP_HEIGHT,
  SCREENSHOT_CROP_WIDTH,
} from "@/lib/landing/screenshotConfig";

type Props = {
  id: string;
  label: string;
  children: ReactNode;
  /** Fixed crop height — default matches compact preview target. */
  heightPx?: number;
};

/** Light card frame for compact hero-crop landing captures (no phone bezel). */
export function ScreenshotCrop({ id, label, children, heightPx = SCREENSHOT_CROP_HEIGHT }: Props) {
  return (
    <div id={id} data-screenshot={id} className="inline-block">
      <div
        role="img"
        aria-label={label}
        className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-md shadow-black/5 dark:shadow-black/20"
        style={{ width: SCREENSHOT_CROP_WIDTH, height: heightPx }}
      >
        {children}
      </div>
    </div>
  );
}
