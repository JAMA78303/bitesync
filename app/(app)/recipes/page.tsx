import { createClient } from "@/lib/supabase/server";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { getProfile } from "@/lib/supabase/profile";
import { getDailyCalorieTarget } from "@/lib/utils/nutrition-targets";
import { canCreateRecipe, getAccess, getRecipeCount } from "@/lib/subscription";
import { isNativeAppRequest } from "@/lib/native/server";
import { RecipesPageClient } from "@/components/recipes/RecipesPageClient";
import type { RecipeListItem } from "@/components/recipes/RecipeListCard";

type RecipeRow = {
 id: string;
 name: string;
 source_domain?: string | null;
 image_url?: string | null;
 is_favourite?: boolean | null;
 fits_vegetarian?: boolean | null;
 fits_vegan?: boolean | null;
};

type Props = { searchParams: Promise<{ view?: string }> };

const BREAKFAST_KEYWORDS = [
"oat",
"porridge",
"egg",
"yoghurt",
"yogurt",
"smoothie",
"toast",
"granola",
"overnight",
"pancake",
"waffle",
"bagel",
"muffin",
"cereal",
"avocado",
"chia",
"berries",
"bircher",
"breakfast",
"morning",
] as const;

export const dynamic = "force-dynamic";

export default async function RecipesPage({ searchParams }: Props) {
 const params = await searchParams;
 const showArchived = params.view ==="archived";
 const supabase = await createClient();
 const [access, count, canCreate, auth, profile, native] = await Promise.all([
 getAccess(),
 getRecipeCount(),
 canCreateRecipe(),
 supabase.auth.getUser(),
 getProfile(),
 isNativeAppRequest(),
 ]);
 // Expired trials can't add recipes at all (an UpgradeCard replaces the
 // controls); only the free plan has a number to warn about.
 const canAddRecipes = access?.canAddRecipes ?? true;
 const recipeLimit = canAddRecipes ? (access?.recipeLimit ?? null) : null;
 const showLimitWarning = recipeLimit !== null && count >= recipeLimit - 2;
 const {
 data: { user },
 } = auth;

 let recipes: RecipeRow[] = [];
 if (user) {
 let query = supabase
 .from("recipes")
 .select("id,name,source_domain,image_url,is_favourite,fits_vegetarian,fits_vegan")
 .order("created_at", { ascending: false });
 query = showArchived ? query.not("archived_at","is", null) : query.is("archived_at", null);
 const { data } = await query;
 recipes = (data as RecipeRow[] | null) ?? [];
 }

 const nutritionMap =
 recipes.length > 0
 ? await fetchRecipeNutritionMap(supabase, recipes.map((r) => r.id), { fillMissing: false })
 : new Map();

 const listItems: RecipeListItem[] = recipes.map((r) => {
 const n = nutritionMap.get(r.id);
 return {
 id: r.id,
 name: r.name,
 sourceDomain: r.source_domain ?? null,
 kcal: n?.calories ?? null,
 protein: n?.protein_g ?? null,
 carbs: Math.round(n?.carbs_g ?? 0),
 fat: Math.round(n?.fat_g ?? 0),
 imageUrl: r.image_url ?? null,
 isFavourite: Boolean(r.is_favourite),
 // The Vegetarian and Vegan tabs filter on these. They were selected above
 // but never passed on, so both tabs were always empty.
 fitsVegetarian: r.fits_vegetarian === true,
 fitsVegan: r.fits_vegan === true,
 };
 });

 const hasBreakfastFriendlyRecipe = recipes.some((recipe) =>
 BREAKFAST_KEYWORDS.some((keyword) => recipe.name.toLowerCase().includes(keyword)),
 );

 const dailyTarget = getDailyCalorieTarget(profile);
 const canFillLibrary = Boolean(dailyTarget && dailyTarget >= 800) && canCreate;
 const fillLibraryBlockedMessage =
 dailyTarget == null || dailyTarget < 800
 ?"Set your daily calorie target in Settings first."
 : !canCreate
 ? native
 ?"Recipe limit reached — archive recipes to make room."
 :"Recipe limit reached — upgrade to Pro or archive recipes."
 : null;

 return (
 <RecipesPageClient
 recipes={listItems}
 showArchived={showArchived}
 showLimitWarning={showLimitWarning}
 recipeCount={count}
 recipeLimit={recipeLimit}
 canAddRecipes={canAddRecipes}
 native={native}
 dietaryPreferences={initialDietaryPreferencesFromProfile(profile)}
 hasBreakfastFriendlyRecipe={hasBreakfastFriendlyRecipe}
 canFillLibrary={canFillLibrary}
 fillLibraryBlockedMessage={fillLibraryBlockedMessage}
 />
 );
}
