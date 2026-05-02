"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getSupportedUnits } from "@/lib/nutrition/convert";
import { calculateRecipeNutrition, type RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { getAllFoodNames } from "@/lib/nutrition/lookup";
import { NutritionPreview } from "@/components/recipes/NutritionPreview";
import { createRecipe, generateGoalMatchedRecipeDraft } from "@/app/(app)/recipes/actions";
import type { GoalMealSlot } from "@/lib/ai/goal-matched-recipe";

type IngredientRow = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

const DEFAULT_UNIT = "g";

function createId(): string {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `ing-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createIngredientRow(): IngredientRow {
  return {
    id: createId(),
    name: "",
    quantity: "",
    unit: DEFAULT_UNIT,
  };
}

const units = getSupportedUnits();
const ingredientSuggestions = getAllFoodNames();

export type RecipeFormProfileTargets = {
  daily_calorie_target: number | null;
  daily_protein_target: number | null;
} | null;

type RecipeFormProps = {
  profileTargets?: RecipeFormProfileTargets;
};

function mapServerIngredientsToRows(server: { name: string; quantity: number; unit: string }[]): IngredientRow[] {
  return server.map((row) => ({
    id: createId(),
    name: row.name,
    quantity: String(row.quantity),
    unit: row.unit,
  }));
}

export function RecipeForm({ profileTargets = null }: RecipeFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>(() => [createIngredientRow()]);
  const [fitsVegetarian, setFitsVegetarian] = useState(false);
  const [fitsVegan, setFitsVegan] = useState(false);
  const [fitsGlutenFree, setFitsGlutenFree] = useState(false);
  const [aiMealSlot, setAiMealSlot] = useState<GoalMealSlot>("lunch");
  const [formMessage, setFormMessage] = useState<string | null>(null);
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

  const nutrition = useMemo(
    () => calculateRecipeNutrition(parsedIngredients),
    [parsedIngredients],
  );

  function updateIngredient(id: string, key: keyof IngredientRow, value: string) {
    setIngredients((current) =>
      current.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, [key]: value } : ingredient,
      ),
    );
  }

  function addIngredient() {
    setIngredients((current) => [...current, createIngredientRow()]);
  }

  function removeIngredient(id: string) {
    setIngredients((current) => {
      if (current.length === 1) {
        return current;
      }
      return current.filter((ingredient) => ingredient.id !== id);
    });
  }

  function onDraftFromGoals() {
    if (!profileTargets?.daily_calorie_target) return;
    setFormError(null);
    setFormMessage(null);
    startTransition(async () => {
      const result = await generateGoalMatchedRecipeDraft({
        mealSlot: aiMealSlot,
        fitsVegan,
        fitsVegetarian,
        fitsGlutenFree,
      });
      if ("error" in result) {
        setFormError(result.error);
        return;
      }
      if (!result.data) {
        setFormError("Unexpected empty response.");
        return;
      }
      const d = result.data;
      setName(d.name);
      setDescription(d.description);
      setIngredients(mapServerIngredientsToRows(d.ingredients));
      setFormMessage(
        `Draft applied: ~${d.achievedCalories} kcal vs meal target ${d.targetMealCalories} kcal (${d.achievedProteinG}g protein).`,
      );
    });
  }

  function onSaveRecipe() {
    setFormError(null);
    setFormMessage(null);

    startTransition(async () => {
      const result = await createRecipe({
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

      setFormMessage(result.message ?? "Recipe created.");
      router.push("/recipes");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create Recipe</h2>
        {formMessage ? (
          <p className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800">
            {formMessage}
          </p>
        ) : null}
        {formError ? (
          <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {formError}
          </p>
        ) : null}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Recipe name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="off"
            className="h-11 w-full rounded-md border border-gray-300 px-3 text-sm"
          />
          <textarea
            placeholder="Description"
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {profileTargets?.daily_calorie_target ? (
          <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Goal-matched draft</p>
            <p className="text-xs text-emerald-900/90">
              Uses your daily calorie target ({Math.round(profileTargets.daily_calorie_target)} kcal) to draft one meal
              within about ±100 kcal of your share for that time of day. Ingredients come from the nutrition database
              (not a creative chef yet — wire Claude later for novel recipes).
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-xs text-emerald-900">
                <span>Meal</span>
                <select
                  value={aiMealSlot}
                  onChange={(e) => setAiMealSlot(e.target.value as GoalMealSlot)}
                  className="h-9 min-w-[140px] rounded-md border border-emerald-200 bg-white px-2 text-sm text-slate-900"
                >
                  <option value="breakfast">Breakfast (~26%)</option>
                  <option value="lunch">Lunch (~33%)</option>
                  <option value="dinner">Dinner (~34%)</option>
                  <option value="snack">Snack (~12%)</option>
                </select>
              </label>
              <button
                type="button"
                onClick={onDraftFromGoals}
                disabled={isPending}
                className="inline-flex h-9 items-center justify-center rounded-md bg-[#1A4731] px-3 text-xs font-medium text-white hover:bg-[#153928] disabled:opacity-60"
              >
                {isPending ? "Drafting…" : "Draft meal from goals"}
              </button>
            </div>
          </div>
        ) : (
          <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Set your calorie target in Settings to enable goal-matched recipe drafts (±100 kcal per meal slot).
          </p>
        )}

        <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium text-slate-600">Diet labels (optional)</p>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={fitsVegetarian}
              onChange={(e) => setFitsVegetarian(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Vegetarian-friendly
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={fitsVegan}
              onChange={(e) => {
                const v = e.target.checked;
                setFitsVegan(v);
                if (v) setFitsVegetarian(true);
              }}
              className="h-4 w-4 rounded border-slate-300"
            />
            Vegan-friendly
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={fitsGlutenFree}
              onChange={(e) => setFitsGlutenFree(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Gluten-free friendly
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Ingredients</h3>
          {ingredients.map((ingredient) => (
            <div key={ingredient.id} className="grid gap-2 md:grid-cols-[1fr_120px_120px_40px]">
              <input
                type="text"
                placeholder="Ingredient name"
                value={ingredient.name}
                onChange={(event) => updateIngredient(ingredient.id, "name", event.target.value)}
                list="nutrition-ingredient-suggestions"
                autoComplete="off"
                className="h-10 rounded-md border border-gray-300 px-3 text-sm"
              />
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 1 for one apple"
                title="Use unit “piece” or “item” for whole fruit"
                value={ingredient.quantity}
                onChange={(event) => updateIngredient(ingredient.id, "quantity", event.target.value)}
                className="h-10 rounded-md border border-gray-300 px-3 text-sm"
              />
              <select
                value={ingredient.unit}
                onChange={(event) => updateIngredient(ingredient.id, "unit", event.target.value)}
                className="h-10 rounded-md border border-gray-300 px-3 text-sm"
              >
                {units.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeIngredient(ingredient.id)}
                aria-label="Remove ingredient row"
                title="Remove ingredient"
                className="h-10 rounded-md border border-gray-300 bg-white px-0 text-lg leading-none text-gray-700 hover:bg-gray-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <datalist id="nutrition-ingredient-suggestions">
          {ingredientSuggestions.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>

        <button
          type="button"
          onClick={addIngredient}
          className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--brand-sage)] px-4 text-sm font-medium text-white hover:opacity-95"
        >
          Add Ingredient
        </button>
        <button
          type="button"
          onClick={onSaveRecipe}
          disabled={isPending}
          className="ml-3 inline-flex h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Saving..." : "Save Recipe"}
        </button>
      </section>

      <NutritionPreview totals={nutrition} />
    </div>
  );
}
