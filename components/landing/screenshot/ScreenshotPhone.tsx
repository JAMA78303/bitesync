"use client";

import type { ReactNode } from "react";
import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { SCREENSHOT_INNER_WIDTH_PX } from "@/lib/landing/screenshotConfig";

type Props = {
  id: string;
  label: string;
  children: ReactNode;
  /** Optional fixed height for hero crop — omit to size to content. */
  heightPx?: number;
};

export function ScreenshotPhone({ id, label, children, heightPx }: Props) {
  return (
    <div id={id} data-screenshot={id} className="inline-block p-4">
      <PhoneFrame label={label} innerWidthPx={SCREENSHOT_INNER_WIDTH_PX}>
        <div
          className="pointer-events-none overflow-hidden bg-[var(--surface-page)] [&_*]:!cursor-default"
          style={{
            width: SCREENSHOT_INNER_WIDTH_PX,
            ...(heightPx ? { height: heightPx } : {}),
          }}
        >
          {children}
        </div>
      </PhoneFrame>
    </div>
  );
}
