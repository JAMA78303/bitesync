import Link from "next/link";
import { DietaryPreferencesPicker } from "@/components/settings/DietaryPreferencesPicker";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { getProfile } from "@/lib/supabase/profile";
import { ds } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function DietaryGoalsPage() {
  const profile = await getProfile();

  return (
    <div className={`${ds.mobilePage} ${ds.pageContent}`}>
      <div className={`border-b border-gray-100 bg-white app-mobile-gutter app-header-safe-top pb-4 dark:border-gray-900 dark:bg-gray-950`}>
        <Link href="/goals" className="mb-2 inline-block text-sm font-medium text-[#3a5a40]">
          ← Nutrition &amp; goals
        </Link>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dietary preferences</h1>
        <p className="mt-0.5 text-sm text-gray-500">Used to personalise your AI meal plans</p>
      </div>
      <div className={`${ds.mobileGutter} pt-4`}>
        <div className={`${ds.card} ${ds.cardPadding}`}>
          <DietaryPreferencesPicker initialSelected={initialDietaryPreferencesFromProfile(profile)} />
        </div>
      </div>
    </div>
  );
}
