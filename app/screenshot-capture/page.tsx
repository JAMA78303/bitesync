import { notFound } from "next/navigation";
import { MockGrocery, MockPlanner, MockToday } from "@/components/landing/LandingPhoneMockups";

const TARGETS = [
  { id: "planner", Mock: MockPlanner },
  { id: "grocery", Mock: MockGrocery },
  { id: "today", Mock: MockToday },
] as const;

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
