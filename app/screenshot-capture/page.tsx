import { notFound } from "next/navigation";
import { ScreenshotCaptureClient } from "@/app/screenshot-capture/ScreenshotCaptureClient";

/** Dev-only targets for `npm run capture:landing` — 404s in production builds. */
export default function ScreenshotCapturePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ScreenshotCaptureClient />;
}
