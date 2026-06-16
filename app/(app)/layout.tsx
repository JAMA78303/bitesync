import { AppShell } from "@/components/shared/AppShell";
import { AppProviders } from "@/components/ui/AppProviders";

export default function ProtectedLayout({
 children,
}: Readonly<{ children: React.ReactNode }>) {
 return (
 <AppProviders>
 <AppShell>{children}</AppShell>
 </AppProviders>
 );
}
