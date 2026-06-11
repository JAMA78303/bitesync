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
};

/** Theme-aware product screenshot (frame + shadow baked into the transparent PNG). */
export function LandingDemoShot({ srcLight, srcDark, alt, width, height, fallback }: Props) {
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
        className="h-auto w-[260px] dark:hidden"
        onError={() => setUseFallback(true)}
      />
      <Image
        src={srcDark}
        alt={alt}
        width={width}
        height={height}
        className="hidden h-auto w-[260px] dark:block"
        onError={() => setUseFallback(true)}
      />
    </>
  );
}
