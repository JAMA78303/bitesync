import Link from "next/link";
import { DietaryPreferencesPicker } from "@/components/settings/DietaryPreferencesPicker";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { getProfile } from "@/lib/supabase/profile";
import { ds } from "@/lib/ui/classes";

export const dynamic ="force-dynamic";

export default async function DietaryGoalsPage() {
 const profile = await getProfile();

 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <div className={ds.gradientHeaderCompact}>
 <Link href="/goals" className={`mb-3 inline-flex min-h-8 items-center text-sm font-semibold ${ds.pageSubtitle} hover:text-[var(--text-on-header)]`}>
 ← Nutrition &amp; goals
 </Link>
 <span className={ds.kicker}>FOOD PREFERENCES</span>
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>Dietary preferences</h1>
 <p className={ds.pageSubtitle}>Used to personalise your AI meal plans</p>
 </div>
 <div className={`${ds.mobileGutter} ${ds.overlap} pt-2`}>
 <div className={`${ds.card} ${ds.cardPadding}`}>
 <DietaryPreferencesPicker initialSelected={initialDietaryPreferencesFromProfile(profile)} />
 </div>
 </div>
 </div>
 );
}
