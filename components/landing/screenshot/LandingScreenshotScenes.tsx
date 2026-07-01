"use client";

import Link from "next/link";
import { PlannerGrid } from "@/components/planner/PlannerGrid";
import { GenerateAIWeekPlanButton } from "@/components/planner/GenerateAIWeekPlanButton";
import { WeekNav } from "@/components/planner/WeekNav";
import { GroceryHeader } from "@/components/grocery/GroceryHeader";
import { GroceryItem } from "@/components/grocery/GroceryItem";
import { MicronutrientPanel } from "@/components/planner/MicronutrientPanel";
import { RecipeDetailView } from "@/components/recipes/RecipeDetailView";
import { ImportRecipeModal } from "@/components/recipes/ImportRecipeModal";
import { DietaryPreferencesPicker } from "@/components/settings/DietaryPreferencesPicker";
import { TDEEForm } from "@/components/settings/TDEEForm";
import { TodayDashboard } from "@/components/today/TodayDashboard";
import { ScreenshotPhone } from "@/components/landing/screenshot/ScreenshotPhone";
import {
  SCREENSHOT_AI_PLAN_ENTRIES,
  SCREENSHOT_AI_PLAN_GRID,
  SCREENSHOT_DIETARY_SELECTED,
  SCREENSHOT_GROCERY_ITEMS,
  SCREENSHOT_IMPORT_PREVIEW,
  SCREENSHOT_MICRO_ANALYSIS,
  SCREENSHOT_PLANNER_ENTRIES,
  SCREENSHOT_PLANNER_GRID,
  SCREENSHOT_PLANNER_RECIPES,
  SCREENSHOT_RECIPE_DETAIL,
  SCREENSHOT_TARGETS,
  SCREENSHOT_TDEE_DEFAULTS,
  SCREENSHOT_TODAY_MEALS,
  SCREENSHOT_TODAY_TOTALS,
  SCREENSHOT_WEEK_DATES,
  SCREENSHOT_WEEK_ISO,
  SCREENSHOT_WEEK_START,
} from "@/lib/landing/screenshotFixtures";
import { ds } from "@/lib/ui/classes";

const noop = () => {};

export function SceneTargets() {
  return (
    <ScreenshotPhone id="targets" label="BiteSync calorie and macro targets preview" maxHeightClass="max-h-[560px]">
      <div className={ds.mobilePage}>
        <div className={ds.gradientHeaderCompact}>
          <p className={ds.pageSubtitle}>Nutrition &amp; goals</p>
          <h1 className={ds.pageTitle}>Calorie &amp; macro targets</h1>
        </div>
        <div className={`${ds.mobileGutter} ${ds.overlap} pt-2`}>
          <div className={`${ds.card} ${ds.cardPadding}`}>
            <TDEEForm defaultValues={SCREENSHOT_TDEE_DEFAULTS} />
          </div>
        </div>
      </div>
    </ScreenshotPhone>
  );
}

function PlannerSceneShell({
  id,
  label,
  entries,
  grid,
  showAiButton,
}: {
  id: string;
  label: string;
  entries: typeof SCREENSHOT_PLANNER_ENTRIES;
  grid: typeof SCREENSHOT_PLANNER_GRID;
  showAiButton: boolean;
}) {
  return (
    <ScreenshotPhone id={id} label={label} maxHeightClass="max-h-[560px]">
      <div className={ds.mobilePage}>
        <div className={ds.gradientHeader}>
          <h1 className={`mb-1 ${ds.pageTitle}`}>Weekly Plan</h1>
          <p className={ds.pageSubtitle}>Plan your meals, generate your list</p>
          <div className="mt-4">
            <WeekNav weekStart={SCREENSHOT_WEEK_START} onGradient />
          </div>
        </div>
        <div className={`${ds.mobileGutter} ${ds.overlap} space-y-4 ${ds.pageContent}`}>
          {showAiButton ? (
            <GenerateAIWeekPlanButton
              isPro
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
          <PlannerGrid
            grid={grid}
            entries={entries}
            mealPlanId="screenshot-plan"
            recipes={SCREENSHOT_PLANNER_RECIPES}
            weekDates={SCREENSHOT_WEEK_DATES}
            weekStartIso={SCREENSHOT_WEEK_ISO}
            initialActiveDay={5}
            dailyCalorieTarget={SCREENSHOT_TARGETS.kcal}
            dailyProteinTarget={SCREENSHOT_TARGETS.protein}
            dietaryPreferences={[]}
          />
        </div>
      </div>
    </ScreenshotPhone>
  );
}

export function ScenePlanner() {
  return (
    <PlannerSceneShell
      id="planner"
      label="BiteSync weekly meal planner preview"
      entries={SCREENSHOT_PLANNER_ENTRIES}
      grid={SCREENSHOT_PLANNER_GRID}
      showAiButton={false}
    />
  );
}

export function SceneAiPlans() {
  return (
    <PlannerSceneShell
      id="ai-plans"
      label="BiteSync AI weekly meal plan preview"
      entries={SCREENSHOT_AI_PLAN_ENTRIES}
      grid={SCREENSHOT_AI_PLAN_GRID}
      showAiButton
    />
  );
}

export function SceneToday() {
  return (
    <ScreenshotPhone id="today" label="BiteSync Today dashboard preview">
      <TodayDashboard
        meals={SCREENSHOT_TODAY_MEALS}
        totals={SCREENSHOT_TODAY_TOTALS}
        targets={SCREENSHOT_TARGETS}
        dietaryPreferences={[]}
      />
    </ScreenshotPhone>
  );
}

export function SceneNutrition() {
  return (
    <ScreenshotPhone id="nutrition" label="BiteSync recipe nutrition preview" maxHeightClass="max-h-[540px]">
      <RecipeDetailView
        recipe={SCREENSHOT_RECIPE_DETAIL.recipe}
        ingredients={SCREENSHOT_RECIPE_DETAIL.ingredients}
        nutrition={SCREENSHOT_RECIPE_DETAIL.nutrition}
        dietaryPreferences={[]}
        editHref="/recipes/screenshot-recipe/edit"
      />
    </ScreenshotPhone>
  );
}

export function SceneGrocery() {
  const checked = SCREENSHOT_GROCERY_ITEMS.filter((i) => i.is_checked).length;
  return (
    <ScreenshotPhone id="grocery" label="BiteSync grocery list preview" maxHeightClass="max-h-[540px]">
      <div className={ds.mobilePage}>
        <GroceryHeader subtitle="Mon 12 – Sun 18 May · 12 items" total={SCREENSHOT_GROCERY_ITEMS.length} checked={checked} />
        <div className={`${ds.mobileGutter} space-y-2 ${ds.pageContent}`}>
          {SCREENSHOT_GROCERY_ITEMS.map((item) => (
            <GroceryItem key={item.id} {...item} />
          ))}
        </div>
      </div>
    </ScreenshotPhone>
  );
}

export function SceneImport() {
  return (
    <ScreenshotPhone id="import" label="BiteSync recipe import preview" maxHeightClass="max-h-[540px]">
      <ImportRecipeModal
        embedded
        initialStep="preview"
        initialResult={SCREENSHOT_IMPORT_PREVIEW}
        onClose={noop}
        onImport={noop}
      />
    </ScreenshotPhone>
  );
}

export function SceneDietary() {
  return (
    <ScreenshotPhone id="dietary" label="BiteSync dietary preferences preview" maxHeightClass="max-h-[540px]">
      <div className={ds.mobilePage}>
        <div className={ds.gradientHeaderCompact}>
          <Link href="/goals" className={`mb-2 inline-block text-sm font-medium ${ds.pageSubtitle}`}>
            ← Nutrition &amp; goals
          </Link>
          <h1 className={ds.pageTitle}>Dietary preferences</h1>
        </div>
        <div className={`${ds.mobileGutter} ${ds.overlap} pt-2`}>
          <DietaryPreferencesPicker initialSelected={SCREENSHOT_DIETARY_SELECTED} submitLabel="Save preferences" />
        </div>
      </div>
    </ScreenshotPhone>
  );
}

export function SceneMicros() {
  return (
    <ScreenshotPhone id="micros" label="BiteSync micronutrient analysis preview" maxHeightClass="max-h-[560px]">
      <div className={`${ds.mobilePage} ${ds.mobileGutter} pt-3`}>
        <MicronutrientPanel analysis={SCREENSHOT_MICRO_ANALYSIS} />
      </div>
    </ScreenshotPhone>
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
