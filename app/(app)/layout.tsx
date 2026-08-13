import { AppShell } from "@/components/shared/AppShell";
import { AppProviders } from "@/components/ui/AppProviders";
import { FirstRunResumeBanner } from "@/components/onboarding/FirstRunResumeBanner";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";
import { firstRunResumeFromProfile } from "@/lib/onboarding/first-run";
import { getProfile } from "@/lib/supabase/profile";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
 children,
}: Readonly<{ children: React.ReactNode }>) {
 let profile = null;
 try {
  profile = await getProfile();
 } catch (error) {
  console.error("[app-layout] getProfile failed", error);
 }
 const resume = firstRunResumeFromProfile(profile);

 return (
 <AppProviders>
 <FirstRunResumeBanner show={resume.show} step={resume.step} />
 <AppShell>{children}</AppShell>
 <FeedbackFab />
 </AppProviders>
 );
}
