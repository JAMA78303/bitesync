"use client";

import { LANDING_SCREENSHOT_SCENES } from "@/components/landing/screenshot/LandingScreenshotScenes";
import { LANDING_FEATURE_SHOT_IDS } from "@/lib/landing/featurePreviewShots";

export function ScreenshotCaptureClient() {
  return (
    <div className="flex min-h-screen flex-wrap items-start justify-center gap-8 p-8">
      {LANDING_FEATURE_SHOT_IDS.map((id) => {
        const Scene = LANDING_SCREENSHOT_SCENES[id];
        return <Scene key={id} />;
      })}
    </div>
  );
}
