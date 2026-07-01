import { AppProviders } from "@/components/ui/AppProviders";

export default function ScreenshotCaptureLayout({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
