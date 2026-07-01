"use client";

import type { ReactNode } from "react";
import { PhoneFrame } from "@/components/landing/PhoneFrame";

type Props = {
  id: string;
  label: string;
  children: ReactNode;
  /** Crop tall app pages to phone preview height. */
  maxHeightClass?: string;
};

export function ScreenshotPhone({
  id,
  label,
  children,
  maxHeightClass = "max-h-[520px]",
}: Props) {
  return (
    <div id={id} data-screenshot={id} className="p-8">
      <PhoneFrame label={label}>
        <div
          className={`pointer-events-none w-[220px] overflow-hidden ${maxHeightClass} [&_*]:!cursor-default`}
        >
          {children}
        </div>
      </PhoneFrame>
    </div>
  );
}
