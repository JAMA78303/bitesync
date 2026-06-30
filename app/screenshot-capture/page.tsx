import { notFound } from "next/navigation";
import { LANDING_FEATURE_SHOT_IDS, LANDING_FEATURE_SHOTS } from "@/lib/landing/featurePreviewShots";

const TARGETS = LANDING_FEATURE_SHOT_IDS.map((id) => ({
  id,
  Mock: LANDING_FEATURE_SHOTS[id].Mock,
}));

/** Dev-only targets for `npm run capture:landing` — 404s in production builds. */
export default function ScreenshotCapturePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="flex min-h-screen flex-wrap items-start justify-center gap-8 p-8">
      {TARGETS.map(({ id, Mock }) => (
        <div key={id} id={id} data-screenshot={id} className="p-8">
          <Mock />
        </div>
      ))}
    </div>
  );
}
