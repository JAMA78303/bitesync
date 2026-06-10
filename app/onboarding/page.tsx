"use client";

import { useRouter } from "next/navigation";
import { DietaryPreferencesPicker } from "@/components/settings/DietaryPreferencesPicker";

export default function OnboardingPage() {
 const router = useRouter();

 return (
 <div className="flex min-h-screen flex-col bg-gradient-to-b from-[var(--header-from)] to-[var(--surface-page)]">
 <div className="flex h-48 items-center justify-center">
 <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--surface-overlay)]/20 text-5xl backdrop-blur-sm">
 🥗
 </div>
 </div>

 <div className="flex flex-1 flex-col rounded-t-3xl bg-[var(--surface-card)] px-6 pt-8 pb-6">
 <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">
 What are your food preferences?
 </h1>
 <p className="mb-6 text-sm text-[var(--text-muted)]">
 We&apos;ll use this to personalise your meal plans.
 </p>

 <DietaryPreferencesPicker
 initialSelected={[]}
 completeOnboarding
 onSaved={() => router.push("/today")}
 />

 <div className="mt-8 flex items-center justify-between">
 <div className="flex gap-1.5">
 <div className="h-1.5 w-6 rounded-full bg-[var(--brand-primary)]" />
 <div className="h-1.5 w-1.5 rounded-full bg-[var(--progress-track)]" />
 <div className="h-1.5 w-1.5 rounded-full bg-[var(--progress-track)]" />
 </div>
 </div>
 </div>
 </div>
 );
}
