import { AppShell } from "@/components/shared/AppShell";
import { AppProviders } from "@/components/ui/AppProviders";
import { FeedbackFab } from "@/components/feedback/FeedbackFab";

export const dynamic = "force-dynamic";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <AppProviders>
      <AppShell>{children}</AppShell>
      <FeedbackFab />
    </AppProviders>
  );
}
