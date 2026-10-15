import { AppShell } from "@/components/shared/AppShell";
import { AppProviders } from "@/components/ui/AppProviders";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";
import { InstallPromptCapture } from "@/components/habit/InstallPromptCapture";
import { getUserTier } from "@/lib/subscription";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
    </AppProviders>
  );
}
