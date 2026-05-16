import { createClient } from "@/lib/supabase/server";
import { fetchRecipeNutritionMap } from "@/lib/supabase/recipe-nutrition-query";
import { initialDietaryPreferencesFromProfile } from "@/lib/dietary/constraints";
import { getProfile } from "@/lib/supabase/profile";
import { getUserTier, getRecipeCount } from "@/lib/subscription";
import { RecipesPageClient } from "@/components/recipes/RecipesPageClient";
import type { RecipeListItem } from "@/components/recipes/RecipeListCard";

type RecipeRow = {
  id: string;
  name: string;
  source_domain?: string | null;
  image_url?: string | null;
  is_favourite?: boolean | null;
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

export default async function RecipesPage({ searchParams }: Props) {
  const params = await searchParams;
  const showArchived = params.view === "archived";
  const supabase = await createClient();
  const [tier, count, auth, profile] = await Promise.all([
    getUserTier(),
    getRecipeCount(),
    supabase.auth.getUser(),
    getProfile(),
  ]);
  const showLimitWarning = tier === "free" && count >= 8;
  const {
    data: { user },
  } = auth;

  let recipes: RecipeRow[] = [];
  if (user) {
    let query = supabase
      .from("recipes")
      .select("id,name,source_domain,image_url,is_favourite")
      .order("created_at", { ascending: false });
    query = showArchived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
    const { data } = await query;
    recipes = (data as RecipeRow[] | null) ?? [];
  }

  const nutritionMap =
    recipes.length > 0 ? await fetchRecipeNutritionMap(supabase, recipes.map((r) => r.id)) : new Map();

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
    };
  });

  const hasBreakfastFriendlyRecipe = recipes.some((recipe) =>
    BREAKFAST_KEYWORDS.some((keyword) => recipe.name.toLowerCase().includes(keyword)),
  );

  return (
    <RecipesPageClient
      recipes={listItems}
      showArchived={showArchived}
      showLimitWarning={showLimitWarning}
      recipeCount={count}
      dietaryPreferences={initialDietaryPreferencesFromProfile(profile)}
      hasBreakfastFriendlyRecipe={hasBreakfastFriendlyRecipe}
    />
  );
}
