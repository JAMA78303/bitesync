"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatIngredientWeightSuffix, defaultUnitForIngredient, getUnitsForIngredient } from "@/lib/nutrition/convert";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { ingredientQuantityError } from "@/lib/recipes/ingredientValidation";
import { useLiveRecipeNutrition } from "@/components/recipes/useLiveRecipeNutrition";
import { getIngredientAutocompleteLabel, getNutritionIngredientNames } from "@/lib/nutrition/lookup";
import { NutritionPreview } from "@/components/recipes/NutritionPreview";
import { ds } from "@/lib/ui/classes";
import { updateRecipe } from "@/app/(app)/recipes/actions";

type IngredientSeed = { name: string; quantity: number; unit: string };
type EditRecipeFormProps = {
 recipeId: string;
 initialName: string;
 initialDescription: string;
 initialIngredients: IngredientSeed[];
 initialFitsVegetarian: boolean;
 initialFitsVegan: boolean;
 initialFitsGlutenFree: boolean;
};

type IngredientRow = { id: string; name: string; quantity: string; unit: string };
const DEFAULT_UNIT ="g";
const ingredientSuggestions = getNutritionIngredientNames();

function createId(): string {
 if (typeof globalThis !=="undefined" && globalThis.crypto?.randomUUID) {
 return globalThis.crypto.randomUUID();
 }
 return `ing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function seedToRows(seeds: IngredientSeed[]): IngredientRow[] {
 if (!seeds.length) return [{ id: createId(), name:"", quantity:"", unit: DEFAULT_UNIT }];
 return seeds.map((seed) => ({
 id: createId(),
 name: seed.name,
 quantity: String(seed.quantity),
 unit: seed.unit || DEFAULT_UNIT,
 }));
}

export function EditRecipeForm({
 recipeId,
 initialName,
 initialDescription,
 initialIngredients,
 initialFitsVegetarian,
 initialFitsVegan,
 initialFitsGlutenFree,
}: EditRecipeFormProps) {
 const router = useRouter();
 const [isPending, startTransition] = useTransition();
 const [name, setName] = useState(initialName);
 const [description, setDescription] = useState(initialDescription);
 const [ingredients, setIngredients] = useState<IngredientRow[]>(() => seedToRows(initialIngredients));
 const [fitsVegetarian, setFitsVegetarian] = useState(initialFitsVegetarian);
 const [fitsVegan, setFitsVegan] = useState(initialFitsVegan);
 const [fitsGlutenFree, setFitsGlutenFree] = useState(initialFitsGlutenFree);
 const [formError, setFormError] = useState<string | null>(null);

 const parsedIngredients: RecipeIngredientInput[] = useMemo(
 () =>
 ingredients.map((ingredient) => ({
 name: ingredient.name,
 quantity: Number(ingredient.quantity),
 unit: ingredient.unit,
 })),
 [ingredients],
 );

 const { totals: nutrition, lookingUp, lineMetaByIngredientIndex } =
 useLiveRecipeNutrition(parsedIngredients);

 function updateIngredient(id: string, key: keyof IngredientRow, value: string) {
 setIngredients((current) =>
 current.map((ingredient) => {
 if (ingredient.id !== id) return ingredient;
 if (key ==="name") {
 const allowedUnits = getUnitsForIngredient(value);
 const unit = allowedUnits.includes(ingredient.unit)
 ? ingredient.unit
 : defaultUnitForIngredient(value);
 return { ...ingredient, name: value, unit };
 }
 return { ...ingredient, [key]: value };
 }),
 );
 }

 function addIngredient() {
 setIngredients((current) => [...current, { id: createId(), name:"", quantity:"", unit: DEFAULT_UNIT }]);
 }

 function removeIngredient(id: string) {
 setIngredients((current) => (current.length === 1 ? current : current.filter((ingredient) => ingredient.id !== id)));
 }

 function onSaveRecipe() {
 setFormError(null);
 const qtyError = ingredients.map((row) => ingredientQuantityError(row.name, row.quantity)).find(Boolean);
 if (qtyError) {
 setFormError(qtyError);
 return;
 }
 startTransition(async () => {
 const result = await updateRecipe({
 recipeId,
 name,
 description,
 ingredients: parsedIngredients,
 fitsVegetarian: fitsVegetarian ? true : undefined,
 fitsVegan: fitsVegan ? true : undefined,
 fitsGlutenFree: fitsGlutenFree ? true : undefined,
 });
 if ("error" in result) {
 setFormError(result.error);
 return;
 }
 router.push(`/recipes/${recipeId}`);
 router.refresh();
 });
 }

 return (
 <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
 <section className={ds.formCard}>
 <h2 className="text-lg font-semibold text-[var(--text-primary)]">Edit Recipe</h2>
 {formError ? (
 <p className={`rounded-md px-3 py-2 text-sm ${ds.warnCallout}`}>{formError}</p>
 ) : null}
 <div className="space-y-3">
 <input
 type="text"
 value={name}
 onChange={(event) => setName(event.target.value)}
 autoComplete="off"
 className={`h-11 ${ds.input}`}
 />
 <textarea
 rows={2}
 value={description}
 onChange={(event) => setDescription(event.target.value)}
 className={`w-full resize-none ${ds.input}`}
 />
 </div>
 <div className={ds.formSection}>
 <p className={ds.formSectionLabel}>Diet labels (optional)</p>
 <label className={`flex cursor-pointer items-center gap-2 ${ds.formSectionText}`}>
 <input
 type="checkbox"
 checked={fitsVegetarian}
 onChange={(e) => setFitsVegetarian(e.target.checked)}
 className="h-4 w-4 rounded border-[var(--border-default)]"
 />
 Vegetarian-friendly
 </label>
 <label className={`flex cursor-pointer items-center gap-2 ${ds.formSectionText}`}>
 <input
 type="checkbox"
 checked={fitsVegan}
 onChange={(e) => {
 const v = e.target.checked;
 setFitsVegan(v);
 if (v) setFitsVegetarian(true);
 }}
 className="h-4 w-4 rounded border-[var(--border-default)]"
 />
 Vegan-friendly
 </label>
 <label className={`flex cursor-pointer items-center gap-2 ${ds.formSectionText}`}>
 <input
 type="checkbox"
 checked={fitsGlutenFree}
 onChange={(e) => setFitsGlutenFree(e.target.checked)}
 className="h-4 w-4 rounded border-[var(--border-default)]"
 />
 Gluten-free friendly
 </label>
 </div>
 <div className="space-y-3">
 <h3 className="font-medium text-[var(--text-primary)]">Ingredients</h3>
 {ingredients.map((ingredient, index) => {
 const qty = Number.parseFloat(ingredient.quantity);
 const qtyError = ingredientQuantityError(ingredient.name, ingredient.quantity);
 const rowUnits = getUnitsForIngredient(ingredient.name);
 const weightHint =
 Number.isFinite(qty) && qty > 0 && ingredient.name.trim()
 ? formatIngredientWeightSuffix(qty, ingredient.unit ||"", ingredient.name)
 : null;
 const lineMeta = lineMetaByIngredientIndex[index];
 return (
 <div key={ingredient.id} className="space-y-1">
 <div className="grid gap-2 md:grid-cols-[1fr_120px_120px_40px]">
 <input
 type="text"
 value={ingredient.name}
 onChange={(event) => updateIngredient(ingredient.id,"name", event.target.value)}
 list="nutrition-ingredient-suggestions"
 autoComplete="off"
 className="h-10 rounded-md border border-[var(--border-default)] px-3 text-sm"
 />
 <input
 type="number"
 min="0"
 step="0.1"
 placeholder="e.g. 1 for one apple"
 title="Use unit “piece”, “item”, or “each” for whole foods"
 value={ingredient.quantity}
 onChange={(event) => updateIngredient(ingredient.id,"quantity", event.target.value)}
 className={`h-10 rounded-md border px-3 text-sm ${
 qtyError ?"border-[var(--semantic-warn-border)] bg-[var(--semantic-warn-bg)]/50" :"border-[var(--border-default)]"
 }`}
 />
 <select
 value={ingredient.unit}
 onChange={(event) => updateIngredient(ingredient.id,"unit", event.target.value)}
 className="h-10 rounded-md border border-[var(--border-default)] px-3 text-sm"
 >
 {rowUnits.map((unit) => (
 <option key={unit} value={unit}>
 {unit}
 </option>
 ))}
 </select>
 <button
 type="button"
 onClick={() => removeIngredient(ingredient.id)}
 className="h-10 rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-0 text-lg leading-none text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
 >
 ×
 </button>
 </div>
 {weightHint ? <p className="text-xs text-[var(--text-muted)] md:pl-1">{weightHint}</p> : null}
 {qtyError ? <p className="text-xs text-[var(--semantic-warn-text)] md:pl-1">{qtyError}</p> : null}
 {(lineMeta?.matchHint || lineMeta?.unknown) && ingredient.name.trim() ? (
 <p className="text-xs text-[var(--text-muted)] md:pl-1">
 {lineMeta.matchHint ? (
 <span title={lineMeta.matchHint}>{lineMeta.matchHint}</span>
 ) : (
"Unknown ingredient — nutrition may be incomplete until saved"
 )}
 </p>
 ) : null}
 </div>
 );
 })}
 </div>
 <datalist id="nutrition-ingredient-suggestions">
 {ingredientSuggestions.map((suggestion) => (
 <option key={suggestion} value={suggestion}>
 {getIngredientAutocompleteLabel(suggestion)}
 </option>
 ))}
 </datalist>
 <button
 type="button"
 onClick={addIngredient}
 className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--brand-sage)] px-4 text-sm font-medium text-[var(--btn-primary-text)] hover:opacity-95"
 >
 Add Ingredient
 </button>
 <button
 type="button"
 onClick={onSaveRecipe}
 disabled={
 isPending ||
 ingredients.some((row) => ingredientQuantityError(row.name, row.quantity) != null)
 }
 className="ml-3 inline-flex h-10 items-center justify-center rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-4 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-70"
 >
 {isPending ?"Saving..." :"Save Changes"}
 </button>
 </section>
 <div className="space-y-2">
 {lookingUp ? (
 <p className="text-center text-xs text-[var(--text-muted)]">Looking up nutrition…</p>
 ) : null}
 <NutritionPreview totals={nutrition} />
 </div>
 </div>
 );
}
