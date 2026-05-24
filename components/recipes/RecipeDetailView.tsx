"use client";

import Link from "next/link";
import { useState } from "react";
import { getDietTag } from "@/lib/ui/dietTags";
import { getDietTagStyle } from "@/lib/ui/dietTagStyles";
import { getMealEmoji } from "@/lib/ui/mealThumbnails";
import { formatIngredientWeightSuffix } from "@/lib/nutrition/convert";
import { ds } from "@/lib/ui/classes";

type Ingredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  nutrition_estimated?: boolean | null;
  cofid_food_name?: string | null;
  cofid_matched_by?: string | null;
};

type Props = {
  recipe: {
    id: string;
    name: string;
    description: string | null;
    servings: number | null;
    source_url: string | null;
    source_domain: string | null;
    imported_at: string | null;
    detected_servings: number | null;
    cooking_for: number | null;
  };
  ingredients: Ingredient[];
  nutrition: {
    calories: number | null;
    protein_g: number | null;
    carbs_g: number | null;
    fat_g: number | null;
  } | null;
  dietaryPreferences: string[];
  editHref: string;
  archiveAction: React.ReactNode;
  deleteAction: React.ReactNode;
};

export function RecipeDetailView({
  recipe,
  ingredients,
  nutrition,
  dietaryPreferences,
  editHref,
  archiveAction,
  deleteAction,
}: Props) {
  const baseServings = Math.max(1, Number(recipe.servings ?? 1));
  const [servings, setServings] = useState(baseServings);
  const multiplier = servings / baseServings;

  const kcal = nutrition?.calories ?? 0;
  const protein = nutrition?.protein_g ?? 0;
  const carbs = nutrition?.carbs_g ?? 0;
  const fat = nutrition?.fat_g ?? 0;

  const dietTag =
    nutrition?.calories != null
      ? getDietTag(kcal, protein, carbs, fat, dietaryPreferences)
      : null;

  const macroCells = [
    { label: "Calories", value: Math.round(kcal * multiplier), unit: "kcal" },
    { label: "Protein", value: Math.round(protein * multiplier), unit: "g" },
    { label: "Carbs", value: Math.round(carbs * multiplier), unit: "g" },
    { label: "Fat", value: Math.round(fat * multiplier), unit: "g" },
  ];

  return (
    <div className="-mx-4 min-h-screen bg-gray-50 pb-28 dark:bg-gray-950 md:mx-0">
      <div className="relative flex h-40 items-center justify-center rounded-b-none bg-[#f0f7f0] dark:bg-[#1a2e1d]">
        <span className="text-7xl" aria-hidden>
          {getMealEmoji(recipe.name, "dinner")}
        </span>
        {recipe.source_domain && recipe.source_url ? (
          <a
            href={recipe.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 bottom-3 flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-xs text-gray-500 backdrop-blur-sm dark:bg-gray-900/80"
          >
            <span>🔗</span> {recipe.source_domain}
          </a>
        ) : null}
      </div>

      <div className="px-5 pt-4">
        <Link href="/recipes" className="mb-4 inline-flex text-sm font-medium text-[#3a5a40]">
          ← Back to recipes
        </Link>

        {dietTag ? (
          <span className={`mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getDietTagStyle(dietTag)}`}>
            {dietTag}
          </span>
        ) : null}
        <h1 className="mb-1 text-xl font-extrabold text-gray-900 dark:text-white">{recipe.name}</h1>
        {recipe.description ? <p className="mb-4 text-sm text-gray-500">{recipe.description}</p> : null}

        <div className="mb-6 grid grid-cols-4 gap-2">
          {macroCells.map((m) => (
            <div key={m.label} className="rounded-xl bg-[#f0f7f0] p-2.5 text-center dark:bg-[#1a2e1d]">
              <p className="text-xs font-bold text-gray-900 dark:text-white">{m.value}</p>
              <p className="text-[9px] text-gray-400">{m.unit}</p>
              <p className="mt-0.5 text-[8px] text-gray-400">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 dark:bg-gray-800">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Serves</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 dark:border-gray-700"
              aria-label="Decrease servings"
            >
              −
            </button>
            <span className="w-4 text-center font-bold text-gray-900 dark:text-white">{servings}</span>
            <button
              type="button"
              onClick={() => setServings((s) => s + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 dark:border-gray-700"
              aria-label="Increase servings"
            >
              +
            </button>
          </div>
        </div>

        <h2 className="mb-3 text-sm font-bold text-gray-900 dark:text-white">Ingredients</h2>
        <div className="mb-6 space-y-0">
          {ingredients.length === 0 ? (
            <p className="text-sm text-gray-500">
              No ingredients yet.{" "}
              <Link href={editHref} className="font-medium text-[#3a5a40] underline">
                Add in edit
              </Link>
            </p>
          ) : (
            ingredients.map((ing) => {
              const qty = Math.round(ing.quantity * multiplier * 100) / 100;
              const weightHint = formatIngredientWeightSuffix(qty, ing.unit, ing.name);
              return (
                <div
                  key={ing.id}
                  className="flex items-center justify-between border-b border-gray-50 py-2 dark:border-gray-800"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {qty} {ing.unit} {ing.name}
                      {weightHint ? <span className="text-gray-400"> {weightHint}</span> : null}
                    </span>
                    {ing.cofid_matched_by && ing.cofid_matched_by !== "exact" ? (
                      <span
                        className="text-xs text-gray-400"
                        title={`Matched to: ${ing.cofid_food_name ?? ""}`}
                      >
                        ~
                      </span>
                    ) : null}
                    {ing.nutrition_estimated ? (
                      <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-600">
                        est.
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex gap-3">
          <Link href="/planner" className={`${ds.primaryBtn} flex-1 py-3.5 text-center`}>
            Add to planner
          </Link>
          <div className="flex gap-2">
            {archiveAction}
            {deleteAction}
          </div>
        </div>
      </div>
    </div>
  );
}
