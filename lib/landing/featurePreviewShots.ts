import type { ComponentType } from "react";
import {
  MockAiPlans,
  MockDietary,
  MockGrocery,
  MockMicros,
  MockPlanner,
  MockRecipeImport,
  MockRecipeNutrition,
  MockTargets,
  MockToday,
} from "@/components/landing/LandingPhoneMockups";

/** Landing feature preview id — must match PNG basename `feature-{id}.png`. */
export type LandingFeaturePreviewId =
  | "targets"
  | "planner"
  | "today"
  | "nutrition"
  | "ai-plans"
  | "grocery"
  | "import"
  | "dietary"
  | "micros";

/** Initial feature tab on load — must match its entry in LANDING_FEATURE_SHOTS. */
export const LANDING_FEATURE_PREVIEW_DEFAULT_ID: LandingFeaturePreviewId = "today";

export type LandingFeatureShot = {
  id: LandingFeaturePreviewId;
  light: string;
  dark: string;
  width: number;
  height: number;
  alt: string;
  Mock: ComponentType;
};

/** Canonical card id → screenshot asset. Filenames always `feature-{id}.png`. */
export const LANDING_FEATURE_SHOTS: Record<LandingFeaturePreviewId, LandingFeatureShot> = {
  targets: {
    id: "targets",
    light: "/landing/feature-targets.png",
    dark: "/landing/feature-targets-dark.png",
    width: 284,
    height: 340,
    alt: "BiteSync calorie and macro targets",
    Mock: MockTargets,
  },
  planner: {
    id: "planner",
    light: "/landing/feature-planner.png",
    dark: "/landing/feature-planner-dark.png",
    width: 284,
    height: 354,
    alt: "BiteSync weekly meal planner",
    Mock: MockPlanner,
  },
  today: {
    id: "today",
    light: "/landing/feature-today.png",
    dark: "/landing/feature-today-dark.png",
    width: 284,
    height: 323,
    alt: "BiteSync Today dashboard",
    Mock: MockToday,
  },
  nutrition: {
    id: "nutrition",
    light: "/landing/feature-nutrition.png",
    dark: "/landing/feature-nutrition-dark.png",
    width: 284,
    height: 360,
    alt: "BiteSync recipe nutrition breakdown",
    Mock: MockRecipeNutrition,
  },
  "ai-plans": {
    id: "ai-plans",
    light: "/landing/feature-ai-plans.png",
    dark: "/landing/feature-ai-plans-dark.png",
    width: 284,
    height: 354,
    alt: "BiteSync AI weekly meal plan",
    Mock: MockAiPlans,
  },
  grocery: {
    id: "grocery",
    light: "/landing/feature-grocery.png",
    dark: "/landing/feature-grocery-dark.png",
    width: 284,
    height: 315,
    alt: "BiteSync grocery list",
    Mock: MockGrocery,
  },
  import: {
    id: "import",
    light: "/landing/feature-import.png",
    dark: "/landing/feature-import-dark.png",
    width: 284,
    height: 330,
    alt: "BiteSync recipe import from URL",
    Mock: MockRecipeImport,
  },
  dietary: {
    id: "dietary",
    light: "/landing/feature-dietary.png",
    dark: "/landing/feature-dietary-dark.png",
    width: 284,
    height: 340,
    alt: "BiteSync dietary preferences",
    Mock: MockDietary,
  },
  micros: {
    id: "micros",
    light: "/landing/feature-micros.png",
    dark: "/landing/feature-micros-dark.png",
    width: 284,
    height: 380,
    alt: "BiteSync weekly micronutrient analysis",
    Mock: MockMicros,
  },
};

export const LANDING_FEATURE_SHOT_IDS = Object.keys(LANDING_FEATURE_SHOTS) as LandingFeaturePreviewId[];

export function landingFeatureShot(id: LandingFeaturePreviewId): LandingFeatureShot {
  return LANDING_FEATURE_SHOTS[id];
}
