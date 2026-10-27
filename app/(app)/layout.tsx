import type { Viewport } from "next";
import { AppShell } from "@/components/shared/AppShell";
import { AppProviders } from "@/components/ui/AppProviders";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";
import { InstallPromptCapture } from "@/components/habit/InstallPromptCapture";
import { NativeAppSync } from "@/components/native/NativeAppSync";
import { getUserTier } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Lets the signed-in pages reach the iPhone's screen edges, so the top bar's and
// bottom nav's env(safe-area-inset-*) padding has real values. Without it those
// are 0, and in the iPhone app the top bar sat under the status bar and Dynamic
// Island. Only here and in onboarding: the marketing pages don't pad for it.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    tier,
  ] = await Promise.all([supabase.auth.getUser(), getUserTier()]);
  const initial = user?.email?.trim().charAt(0).toUpperCase() || "?";

  return (
    <AppProviders>
      <AppShell initial={initial} isPro={tier === "pro"}>
        {children}
      </AppShell>
      <FeedbackFab />
      <InstallPromptCapture />
      <NativeAppSync />
    </AppProviders>
  );
}
