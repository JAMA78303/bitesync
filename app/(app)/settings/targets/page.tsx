import Link from "next/link";
import { Lock } from "lucide-react";
import { TDEEForm } from "@/components/settings/TDEEForm";
import { isProSubscriptionStatus } from "@/lib/subscription";
import { getProfile } from "@/lib/supabase/profile";
import { ds } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function TargetsSettingsPage() {
  const profile = await getProfile();
  const isPro = isProSubscriptionStatus(profile?.subscription_status);

  const defaultValues = profile?.weight_kg
    ? {
        weightKg: Number(profile.weight_kg),
        heightCm: Number(profile.height_cm),
        age: Number(profile.age),
        sex: profile.sex as "male" | "female",
        activityLevel: profile.activity_level as
          | "sedentary"
          | "light"
          | "moderate"
          | "active"
          | "extra_active",
        goal: profile.goal as "lose" | "maintain" | "gain",
      }
    : undefined;

  return (
    <div className="-mx-4 min-h-screen bg-gray-50 pb-28 dark:bg-gray-950 md:mx-0">
      <div className="border-b border-gray-100 bg-white px-4 pt-14 pb-4 dark:border-gray-900 dark:bg-gray-950">
        <Link href="/settings" className="mb-2 inline-block text-sm font-medium text-[#3a5a40]">
          ← Settings
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Calorie & macro targets</h1>
        <p className="mt-0.5 text-sm text-gray-500">Based on your body stats and goal</p>
      </div>
      <div className="px-4 pt-4">
        {isPro ? (
          <div className={`${ds.card} ${ds.cardPadding}`}>
            <TDEEForm defaultValues={defaultValues} />
          </div>
        ) : (
          <div className={`${ds.card} ${ds.cardPadding} text-center`}>
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-600">Pro feature</p>
            <p className="mb-4 text-xs text-gray-400">
              Set calorie and protein targets based on body stats, activity level, and goal.
            </p>
            <Link href="/billing" className={ds.primaryBtn}>
              Upgrade to Pro
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
