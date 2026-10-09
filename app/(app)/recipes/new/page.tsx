import Link from "next/link";
import { RecipeForm } from "@/components/recipes/RecipeForm";
import { RecipeLimitReached } from "@/components/recipes/RecipeLimitReached";
import { getProfile } from "@/lib/supabase/profile";
import { getDailyCalorieTarget, getDailyProteinTarget } from "@/lib/utils/nutrition-targets";
import { canCreateRecipe, getRecipeCount } from "@/lib/subscription";
import { ds } from "@/lib/ui/classes";

export const dynamic = "force-dynamic";

export default async function NewRecipePage() {
 const allowed = await canCreateRecipe();
 const count = await getRecipeCount();

 if (!allowed) {
 return (
 <div className={`${ds.mobileGutter} py-4 md:py-0`}>
 <RecipeLimitReached count={count} />
 </div>
 );
 }

 const profile = await getProfile();
 const profileTargets =
 profile != null
 ? {
 daily_calorie_target: getDailyCalorieTarget(profile),
 daily_protein_target: getDailyProteinTarget(profile),
 }
 : null;

 return (
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <header className={`${ds.gradientHeader} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
 <div className="min-w-0">
 <span className={ds.kicker}>YOUR LIBRARY</span>
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>New recipe</h1>
 <p className={ds.pageSubtitle}>
 Build your ingredient list and BiteSync will estimate macro and micro totals live.
 </p>
 </div>
 <Link href="/recipes" className={`${ds.heroGhostBtn} shrink-0 self-start md:self-center`}>
 ← Back to recipes
 </Link>
 </header>
 <div className={ds.mobileGutter}>
 <RecipeForm profileTargets={profileTargets} />
 </div>
 </div>
 );
}
