import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditRecipeForm } from "@/components/recipes/EditRecipeForm";
import { ds } from "@/lib/ui/classes";

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
 <div className={`${ds.mobilePage} ${ds.pageContent}`}>
 <header className={`${ds.gradientHeader} flex flex-col gap-4 md:flex-row md:items-center md:justify-between`}>
 <div className="min-w-0">
 <span className={ds.kicker}>EDIT RECIPE</span>
 <h1 className={`mb-1.5 ${ds.pageTitle}`}>{recipe.name}</h1>
 <p className={ds.pageSubtitle}>Update ingredients and nutrition will recalculate automatically.</p>
 </div>
 <Link href={`/recipes/${recipe.id}`} className={`${ds.heroGhostBtn} shrink-0 self-start md:self-center`}>
 ← Back to recipe
 </Link>
 </header>
 <div className={ds.mobileGutter}>
 <EditRecipeForm
 recipeId={recipe.id}
 initialName={recipe.name}
 initialDescription={recipe.description ??""}
 initialIngredients={(ingredients as IngredientRow[] | null) ?? []}
 initialFitsVegetarian={recipe.fits_vegetarian === true}
 initialFitsVegan={recipe.fits_vegan === true}
 initialFitsGlutenFree={recipe.fits_gluten_free === true}
 />
 </div>
 </div>
 );
}
