"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  srcLight: string;
  srcDark: string;
  alt: string;
  width: number;
  height: number;
  /** Live mock rendered if the static capture is missing. */
  fallback: React.ReactNode;
  /** Width classes — override for full-width mobile layouts. */
  sizeClassName?: string;
  /** Cap rendered height on mobile (compact hero crops). */
  maxHeightClassName?: string;
};

/** Theme-aware product screenshot (compact crop baked into transparent PNG). */
export function LandingDemoShot({
  srcLight,
  srcDark,
  alt,
  width,
  height,
  fallback,
  sizeClassName = "w-full max-w-[360px]",
  maxHeightClassName = "max-h-[280px]",
}: Props) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <>{fallback}</>;
  }

  return (
    <>
      <Image
        src={srcLight}
        alt={alt}
        width={width}
        height={height}
        className={`h-auto ${maxHeightClassName} ${sizeClassName} object-contain dark:hidden`}
        onError={() => setUseFallback(true)}
      />
      <Image
        src={srcDark}
        alt={alt}
        width={width}
        height={height}
        className={`hidden h-auto ${maxHeightClassName} ${sizeClassName} object-contain dark:block`}
        onError={() => setUseFallback(true)}
      />
    </>
  );
}
