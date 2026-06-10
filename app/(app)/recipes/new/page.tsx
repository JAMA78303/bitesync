import { RecipeForm } from "@/components/recipes/RecipeForm";
import { RecipeLimitReached } from "@/components/recipes/RecipeLimitReached";
import { getProfile } from "@/lib/supabase/profile";
import { getDailyCalorieTarget, getDailyProteinTarget } from "@/lib/utils/nutrition-targets";
import { canCreateRecipe, getRecipeCount } from "@/lib/subscription";

export default async function NewRecipePage() {
 const allowed = await canCreateRecipe();
 const count = await getRecipeCount();

 if (!allowed) {
 return <RecipeLimitReached count={count} />;
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
 <section className="space-y-4">
 <div>
 <h1 className="text-2xl font-semibold text-[var(--text-primary)]">New Recipe</h1>
 <p className="text-[var(--text-secondary)]">
 Build your ingredient list and BiteSync will estimate macro and micro totals live.
 </p>
 </div>
 <RecipeForm profileTargets={profileTargets} />
 </section>
 );
}
