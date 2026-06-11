import { MockGrocery, MockPlanner, MockToday } from "@/components/landing/LandingPhoneMockups";

const TARGETS = [
  { id: "planner", Mock: MockPlanner },
  { id: "grocery", Mock: MockGrocery },
  { id: "today", Mock: MockToday },
] as const;

/** Dev-only targets for `npm run capture:landing` — not linked from the app. */
export default function ScreenshotCapturePage() {
  return (
    <div className="flex min-h-screen flex-wrap items-start justify-center gap-8 bg-[var(--surface-page)] p-8">
      {TARGETS.map(({ id, Mock }) => (
        <div key={id} id={id} data-screenshot={id} className="scroll-mt-8">
          <Mock />
        </div>
      ))}
    </div>
  );
}
