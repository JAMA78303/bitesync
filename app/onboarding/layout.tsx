import { AppProviders } from "@/components/ui/AppProviders";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
