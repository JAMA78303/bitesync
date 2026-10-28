import type { Viewport } from "next";
import { AppProviders } from "@/components/ui/AppProviders";

// As in app/(app)/layout.tsx: lets the header pad below the iPhone status bar.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
