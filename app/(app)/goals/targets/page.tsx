import Link from "next/link";
import { CofidAttribution } from "@/components/nutrition/CofidAttribution";
import { TDEEForm } from "@/components/settings/TDEEForm";
import { getProfile } from "@/lib/supabase/profile";
import { ds } from "@/lib/ui/classes";

export const dynamic ="force-dynamic";

// Free-tier since the targets gate was lifted — see saveTDEEProfile. This page
// used to show a padlock and an upgrade button to free users, which meant a
// free user who mistyped their weight during onboarding had no way back here.
export default async function TargetsGoalsPage() {
 const profile = await getProfile();

 const defaultValues = profile?.weight_kg
 ? {
 weightKg: Number(profile.weight_kg),
 heightCm: Number(profile.height_cm),
 age: Number(profile.age),
 sex: profile.sex as"male" |"female",
 activityLevel: profile.activity_level as
 |"sedentary"
 |"light"
 |"moderate"
 |"active"
 |"extra_active",
 goal: profile.goal as"lose" |"maintain" |"gain",
 }
 : undefined;

 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <div className={ds.gradientHeaderCompact}>
 <Link href="/goals" className={`mb-2 inline-block text-sm font-medium ${ds.pageSubtitle}`}>
 ← Nutrition &amp; goals
 </Link>
 <h1 className={ds.pageTitle}>Calorie &amp; macro targets</h1>
 <p className={`mt-0.5 ${ds.pageSubtitle}`}>Based on your body stats and goal</p>
 </div>
 <div className={`${ds.mobileGutter} ${ds.overlap} pt-2`}>
 <div className={`${ds.card} ${ds.cardPadding}`}>
 <TDEEForm defaultValues={defaultValues} />
 </div>
 <CofidAttribution className="mt-6 px-1" />
 </div>
 </div>
 );
}
