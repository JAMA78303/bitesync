"use client";

import { Link as LinkIcon } from "lucide-react";
import { RecipeSlotCard } from "@/components/planner/RecipeSlotCard";
import { GenerateAIWeekPlanButton } from "@/components/planner/GenerateAIWeekPlanButton";
import { GroceryItem } from "@/components/grocery/GroceryItem";
import { MicronutrientPanel } from "@/components/planner/MicronutrientPanel";
import { TodayDashboard } from "@/components/today/TodayDashboard";
import { ScreenshotCrop } from "@/components/landing/screenshot/ScreenshotCrop";
import { DIETARY_PREFERENCE_OPTIONS } from "@/lib/dietary/constants";
import { sumDayNutritionFromEntries } from "@/lib/planner/weekly-macros";
import {
  SCREENSHOT_AI_PLAN_ENTRIES,
  SCREENSHOT_DIETARY_SELECTED,
  SCREENSHOT_GROCERY_ITEMS,
  SCREENSHOT_MICRO_ANALYSIS,
  SCREENSHOT_PLANNER_ENTRIES,
  SCREENSHOT_RECIPE_DETAIL,
  SCREENSHOT_TARGETS,
  SCREENSHOT_TDEE_DEFAULTS,
  SCREENSHOT_TODAY_MEALS,
  SCREENSHOT_TODAY_TOTALS,
} from "@/lib/landing/screenshotFixtures";
import type { MealPlanEntry, MealType } from "@/types";

function entryForDayMeal(entries: MealPlanEntry[], day: number, mealType: MealType) {
  return entries.find((e) => e.day_of_week === day && e.meal_type === mealType) ?? null;
}

function PlannerDayCompact({
  entries,
  day = 0,
  showAiButton = false,
}: {
  entries: MealPlanEntry[];
  day?: number;
  showAiButton?: boolean;
}) {
  const breakfast = entryForDayMeal(entries, day, "breakfast");
  const lunch = entryForDayMeal(entries, day, "lunch");
  const dayEntries = entries.filter((e) => e.day_of_week === day);
  const { kcal, protein } = sumDayNutritionFromEntries(day, entries);

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
      {showAiButton ? (
        <GenerateAIWeekPlanButton
          plan="pro"
          mealPlanId="screenshot-plan"
          goals={{
            calorieTarget: SCREENSHOT_TARGETS.kcal,
            proteinTarget: SCREENSHOT_TARGETS.protein,
            followsVegetarian: false,
            followsVegan: false,
            followsGlutenFree: false,
          }}
        />
      ) : null}
      {breakfast ? <RecipeSlotCard entry={breakfast} dietaryPreferences={[]} /> : null}
      {lunch ? <RecipeSlotCard entry={lunch} dietaryPreferences={[]} /> : null}
      {dayEntries.length > 0 ? (
        <div className="mt-auto rounded-xl border border-[var(--border-default)] bg-[var(--surface-muted)] px-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Day total</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {Math.round(kcal)} kcal · {Math.round(protein)}g P
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TargetsCompactCard() {
  const chips = [
    { label: "Protein", value: SCREENSHOT_TARGETS.protein, unit: "g" },
    { label: "Carbs", value: SCREENSHOT_TARGETS.carbs, unit: "g" },
    { label: "Fat", value: SCREENSHOT_TARGETS.fat, unit: "g" },
  ];

  return (
    <div className="flex h-full flex-col justify-center p-4">
      <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">Your daily targets</p>
      <p className="mb-3 text-3xl font-bold text-[var(--brand-primary)]">
        {SCREENSHOT_TARGETS.kcal}
        <span className="ml-1 text-base font-semibold text-[var(--text-muted)]">kcal</span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {chips.map((chip) => (
          <div key={chip.label} className="rounded-xl bg-[var(--surface-brand-subtle)] p-2 text-center">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {chip.value}
              <span className="text-2xs font-normal text-[var(--text-muted)]">{chip.unit}</span>
            </p>
            <p className="text-2xs text-[var(--text-muted)]">{chip.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-2xs text-[var(--text-muted)]">
        Based on {SCREENSHOT_TDEE_DEFAULTS.weightKg} kg · {SCREENSHOT_TDEE_DEFAULTS.activityLevel} activity ·{" "}
        {SCREENSHOT_TDEE_DEFAULTS.goal}
      </p>
    </div>
  );
}

function NutritionMacroCompact() {
  const { nutrition, recipe } = SCREENSHOT_RECIPE_DETAIL;
  const cells = [
    { label: "Calories", value: nutrition.calories ?? 0, unit: "kcal" },
    { label: "Protein", value: nutrition.protein_g ?? 0, unit: "g" },
    { label: "Carbs", value: nutrition.carbs_g ?? 0, unit: "g" },
    { label: "Fat", value: nutrition.fat_g ?? 0, unit: "g" },
  ];

  return (
    <div className="flex h-full flex-col justify-center p-4">
      <p className="mb-1 text-xs font-medium text-[var(--text-muted)]">Per serving</p>
      <p className="mb-3 truncate text-base font-bold text-[var(--text-primary)]">{recipe.name}</p>
      <div className="grid grid-cols-4 gap-2">
        {cells.map((m) => (
          <div key={m.label} className="rounded-xl bg-[var(--surface-brand-subtle)] p-2 text-center">
            <p className="text-xs font-bold text-[var(--text-primary)]">{m.value}</p>
            <p className="text-2xs text-[var(--text-muted)]">{m.unit}</p>
            <p className="mt-0.5 text-2xs text-[var(--text-muted)]">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImportUrlCompact() {
  const sampleUrl = "https://www.bbcgoodfood.com/recipes/lemon-chicken";

  return (
    <div className="flex h-full flex-col justify-center gap-3 p-4">
      <p className="text-sm font-semibold text-[var(--text-primary)]">Import recipe</p>
      <p className="text-xs leading-relaxed text-[var(--text-muted)]">Paste a link — review ingredients before saving.</p>
      <div className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-input)] px-3 py-2">
        <LinkIcon className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
        <span className="min-w-0 flex-1 truncate text-sm text-[var(--text-primary)]">{sampleUrl}</span>
      </div>
      <button
        type="button"
        className="flex h-11 items-center justify-center rounded-xl bg-[var(--btn-primary-bg)] text-sm font-medium text-[var(--btn-primary-text)]"
        tabIndex={-1}
      >
        Import
      </button>
    </div>
  );
}

function DietaryChipsCompact() {
  const keys = ["vegetarian", "vegan", "gluten_free"] as const;
  const selected = new Set(SCREENSHOT_DIETARY_SELECTED);

  return (
    <div className="flex h-full flex-col justify-center gap-2 p-4">
      <p className="mb-1 text-sm font-semibold text-[var(--text-primary)]">Dietary preferences</p>
      {keys.map((key) => {
        const pref = DIETARY_PREFERENCE_OPTIONS.find((p) => p.key === key)!;
        const isSelected = selected.has(key);
        return (
          <div
            key={key}
            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
              isSelected
                ? "border-[var(--brand-action-mid)] bg-[var(--surface-brand-subtle)]"
                : "border-[var(--border-default)] bg-[var(--surface-card)]"
            }`}
          >
            <span className="text-lg" aria-hidden>
              {pref.icon}
            </span>
            <span className="text-sm font-medium text-[var(--text-primary)]">{pref.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function MicrosCompact() {
  return (
    <div className="h-full overflow-hidden p-2">
      <MicronutrientPanel analysis={SCREENSHOT_MICRO_ANALYSIS} rowLimit={5} />
    </div>
  );
}

export function SceneTargets() {
  return (
    <ScreenshotCrop id="targets" label="BiteSync calorie and macro targets preview">
      <TargetsCompactCard />
    </ScreenshotCrop>
  );
}

export function ScenePlanner() {
  return (
    <ScreenshotCrop id="planner" label="BiteSync weekly meal planner preview">
      <PlannerDayCompact entries={SCREENSHOT_PLANNER_ENTRIES} />
    </ScreenshotCrop>
  );
}

export function SceneAiPlans() {
  return (
    <ScreenshotCrop id="ai-plans" label="BiteSync AI weekly meal plan preview">
      <PlannerDayCompact entries={SCREENSHOT_AI_PLAN_ENTRIES} showAiButton />
    </ScreenshotCrop>
  );
}

export function SceneToday() {
  return (
    <ScreenshotCrop id="today" label="BiteSync Today dashboard preview">
      <TodayDashboard
        meals={SCREENSHOT_TODAY_MEALS}
        totals={SCREENSHOT_TODAY_TOTALS}
        targets={SCREENSHOT_TARGETS}
        dietaryPreferences={[]}
        heroOnly
        compactHero
      />
    </ScreenshotCrop>
  );
}

export function SceneNutrition() {
  return (
    <ScreenshotCrop id="nutrition" label="BiteSync recipe nutrition preview">
      <NutritionMacroCompact />
    </ScreenshotCrop>
  );
}

export function SceneGrocery() {
  return (
    <ScreenshotCrop id="grocery" label="BiteSync grocery list preview">
      <div className="flex h-full flex-col gap-2 overflow-hidden p-3">
        <div className="rounded-xl bg-[var(--brand-primary)] px-3 py-2 text-[var(--text-on-brand)]">
          <p className="text-sm font-semibold">Grocery list</p>
          <p className="text-2xs text-[var(--text-on-brand-muted)]">Mon 12 – Sun 18 May · 5 items</p>
        </div>
        {SCREENSHOT_GROCERY_ITEMS.slice(0, 4).map((item) => (
          <GroceryItem key={item.id} {...item} />
        ))}
      </div>
    </ScreenshotCrop>
  );
}

export function SceneImport() {
  return (
    <ScreenshotCrop id="import" label="BiteSync recipe import preview">
      <ImportUrlCompact />
    </ScreenshotCrop>
  );
}

export function SceneDietary() {
  return (
    <ScreenshotCrop id="dietary" label="BiteSync dietary preferences preview">
      <DietaryChipsCompact />
    </ScreenshotCrop>
  );
}

export function SceneMicros() {
  return (
    <ScreenshotCrop id="micros" label="BiteSync micronutrient analysis preview">
      <MicrosCompact />
    </ScreenshotCrop>
  );
}

export const LANDING_SCREENSHOT_SCENES = {
  targets: SceneTargets,
  planner: ScenePlanner,
  today: SceneToday,
  nutrition: SceneNutrition,
  "ai-plans": SceneAiPlans,
  grocery: SceneGrocery,
  import: SceneImport,
  dietary: SceneDietary,
  micros: SceneMicros,
} as const;
