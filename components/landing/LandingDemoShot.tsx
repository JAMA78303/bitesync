"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  fallback: React.ReactNode;
};

export function LandingDemoShot({ src, alt, fallback }: Props) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return <>{fallback}</>;
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={260}
      height={520}
      className="h-auto w-[260px] rounded-[2rem] shadow-lg ring-1 ring-black/10"
      onError={() => setUseFallback(true)}
      priority={false}
    />
  );
}
