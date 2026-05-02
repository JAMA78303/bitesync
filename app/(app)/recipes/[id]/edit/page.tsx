import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditRecipeForm } from "@/components/recipes/EditRecipeForm";

type EditPageProps = { params: Promise<{ id: string }> };

type IngredientRow = { name: string; quantity: number; unit: string };

export default async function EditRecipePage({ params }: EditPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: recipe } = await supabase
    .from("recipes")
    .select("id,name,description,fits_vegetarian,fits_vegan,fits_gluten_free")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("archived_at", null)
    .single();
  if (!recipe) notFound();

  const { data: ingredients } = await supabase
    .from("recipe_ingredients")
    .select("name,quantity,unit")
    .eq("recipe_id", id);

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Edit {recipe.name}</h1>
        <p className="text-sm text-gray-600">Update ingredients and nutrition will recalculate automatically.</p>
      </div>
      <EditRecipeForm
        recipeId={recipe.id}
        initialName={recipe.name}
        initialDescription={recipe.description ?? ""}
        initialIngredients={(ingredients as IngredientRow[] | null) ?? []}
        initialFitsVegetarian={recipe.fits_vegetarian === true}
        initialFitsVegan={recipe.fits_vegan === true}
        initialFitsGlutenFree={recipe.fits_gluten_free === true}
      />
    </section>
  );
}
