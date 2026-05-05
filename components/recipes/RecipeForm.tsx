"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatIngredientWeightSuffix, getSupportedUnits } from "@/lib/nutrition/convert";
import { calculateRecipeNutrition, type RecipeIngredientInput } from "@/lib/nutrition/calculate";
import { getAllFoodNames, getIngredientAutocompleteLabel } from "@/lib/nutrition/lookup";
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
const FRUIT_AND_VEG = [
  "broccoli",
  "spinach",
  "kale",
  "lettuce",
  "rocket",
  "cucumber",
  "tomatoes",
  "tomato",
  "onion",
  "carrots",
  "carrot",
  "celery",
  "peppers",
  "red pepper",
  "green pepper",
  "courgette",
  "aubergine",
  "mushrooms",
  "cauliflower",
  "cabbage",
  "leeks",
  "asparagus",
  "green beans",
  "peas",
  "sweetcorn",
  "beetroot",
  "butternut squash",
  "sweet potato",
  "banana",
  "apple",
  "orange",
  "mango",
  "strawberries",
  "blueberries",
  "raspberries",
  "grapes",
  "pineapple",
  "watermelon",
  "avocado",
  "lemon",
  "lime",
  "pear",
  "peach",
  "kiwi",
];

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
  const fruitAndVegCount = useMemo(
    () =>
      ingredients.filter((ing) =>
        FRUIT_AND_VEG.some((fv) => ing.name.toLowerCase().includes(fv)),
      ).length,
    [ingredients],
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
      const variationSeed = Date.now() ^ Math.floor(Math.random() * 0x7fffffff);
      const draftNonce =
        typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto
          ? globalThis.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const result = await generateGoalMatchedRecipeDraft({
        mealSlot: aiMealSlot,
        fitsVegan,
        fitsVegetarian,
        fitsGlutenFree,
        variationSeed,
        draftNonce,
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
      setIngredients(mapServerIngredientsToRows(d.ingredients));
      setFormMessage(`Draft applied: ~${d.achievedCalories} kcal · ${d.achievedProteinG}g protein`);
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
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          UK guidelines recommend 5 portions of fruit and veg per day. Aim for 2 vegetables per main meal and 1 fruit per breakfast or snack.
        </p>

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
          {ingredients.map((ingredient) => {
            const qty = Number.parseFloat(ingredient.quantity);
            const weightHint =
              Number.isFinite(qty) && qty > 0 && ingredient.name.trim()
                ? formatIngredientWeightSuffix(qty, ingredient.unit || "", ingredient.name)
                : null;
            return (
              <div key={ingredient.id} className="space-y-1">
                <div className="grid gap-2 md:grid-cols-[1fr_120px_120px_40px]">
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
                    title="Use unit “piece”, “item”, or “each” for whole foods"
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
                {weightHint ? <p className="text-xs text-slate-500 md:pl-1">{weightHint}</p> : null}
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

        {ingredients.length > 0 ? (
          <div
            className={`mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
              fruitAndVegCount >= 2
                ? "border-[#6EE7B7] bg-[#D1FAE5] text-[#1A4731]"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            <span>{fruitAndVegCount} fruit/veg</span>
            <span>{fruitAndVegCount >= 2 ? "✓ Good variety" : "· Aim for 2+ per meal towards 5-a-day"}</span>
            <a
              href="https://www.nhs.uk/live-well/eat-well/5-a-day/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto underline opacity-70"
            >
              NHS 5-a-day
            </a>
          </div>
        ) : null}

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
