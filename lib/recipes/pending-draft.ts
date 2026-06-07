import type { GoalMealSlot } from "@/lib/ai/goal-matched-recipe";
import type { RecipeIngredientInput } from "@/lib/nutrition/calculate";

export const PENDING_RECIPE_DRAFT_KEY = "bitesync-pending-recipe-draft";

export type PendingRecipeDraft = {
  ingredients: RecipeIngredientInput[];
  name?: string;
  mealSlot?: GoalMealSlot;
  label?: string;
};
