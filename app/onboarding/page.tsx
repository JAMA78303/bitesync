"use client";

import { useRouter } from "next/navigation";
import { DietaryPreferencesPicker } from "@/components/settings/DietaryPreferencesPicker";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#3a5a40] to-[#f5f7f5] dark:from-[#1a2e1d] dark:to-[#0b1220]">
      <div className="flex h-48 items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-5xl backdrop-blur-sm">
          🥗
        </div>
      </div>

      <div className="flex flex-1 flex-col rounded-t-3xl bg-white px-6 pt-8 pb-6 dark:bg-gray-950">
        <h1 className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
          What are your food preferences?
        </h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          We&apos;ll use this to personalise your meal plans.
        </p>

        <DietaryPreferencesPicker
          initialSelected={[]}
          completeOnboarding
          onSaved={() => router.push("/today")}
        />

        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="h-1.5 w-6 rounded-full bg-[#3a5a40]" />
            <div className="h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-1.5 w-1.5 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
