import { Suspense } from "react";
import { FirstRunWelcomeAnalytics } from "@/components/onboarding/FirstRunWelcomeAnalytics";

export default function GroceryLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <FirstRunWelcomeAnalytics />
      </Suspense>
      {children}
    </>
  );
}
