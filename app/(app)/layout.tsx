import { AppShell } from "@/components/shared/AppShell";
import { AppProviders } from "@/components/ui/AppProviders";
import { FirstRunResumeBanner, firstRunResumeFromProfile } from "@/components/onboarding/FirstRunResumeBanner";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";
import { getProfile } from "@/lib/supabase/profile";

export default async function ProtectedLayout({
 children,
}: Readonly<{ children: React.ReactNode }>) {
 const profile = await getProfile();
 const resume = firstRunResumeFromProfile(profile);

 return (
 <AppProviders>
 <FirstRunResumeBanner show={resume.show} step={resume.step} />
 <AppShell>{children}</AppShell>
 <FeedbackFab />
 </AppProviders>
 );
}
