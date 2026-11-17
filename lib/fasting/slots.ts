import { MEAL_LABELS, type MealType } from "@/types";

/**
 * On a fasting day the planner's existing slots take new names: no new meal
 * types, so every plan, grocery list and total keeps working. Lunch isn't
 * planned. Within the calendar day they run in clock order: suhoor before
 * dawn, iftar at sunset, then a late snack.
 */
export const FASTING_SLOT_LABELS: Record<MealType, string> = {
  breakfast: "Suhoor",
  lunch: "Lunch",
  dinner: "Iftar",
  snack: "Late snack",
};

export const FASTING_MEAL_ORDER: MealType[] = ["breakfast", "dinner", "snack", "lunch"];

export function mealSlotLabel(mealType: MealType, fasting: boolean): string {
  return fasting ? FASTING_SLOT_LABELS[mealType] : MEAL_LABELS[mealType];
}

/**
 * Share of the day's protein (and calories) for each slot on a fasting day.
 *
 * PROPOSED, awaiting James's sign-off as dietitian: the spec's starting point
 * of 40% suhoor, 40% iftar, 20% late snack. The day's totals don't change
 * (DEC-007); only how they're spread.
 */
export const FASTING_SLOT_SHARES = { breakfast: 0.4, dinner: 0.4, snack: 0.2 } as const;

/** Suhoor reminder: this long before Fajr. */
export const SUHOOR_REMINDER_MINUTES = 45;

export const SUHOOR_GUIDANCE =
  "Slow-release carbs, protein, fibre and plenty of fluids, to keep you full until iftar.";
export const IFTAR_GUIDANCE = "Open with water and a few dates, then a protein-first plate.";
export const TRAINING_TIP =
  "Best times to train: about 60–90 minutes after iftar, or a light session just before iftar.";

/** Glasses of fluid between iftar and suhoor (the NHS Eatwell Guide's 6–8 a day), spread out. */
export const HYDRATION_GLASSES = { min: 6, max: 8 } as const;

/** Foods that suit suhoor; the planner prefers suhoor recipes that contain one. */
const SUHOOR_FOOD =
  /\b(oats?|oatmeal|porridge|eggs?|omelette|shakshuka|y[oa]gh?urt|skyr|kefir|labneh|cottage cheese|beans?|lentils?|chickpeas?|houmous|hummus|ful|whole ?(grain|meal|wheat)|rye|barley|bulgur|quinoa|chia|flaxseed)\b/i;

export function isSuhoorFood(name: string, ingredientNames: string[] = []): boolean {
  return SUHOOR_FOOD.test(name) || ingredientNames.some((i) => SUHOOR_FOOD.test(i));
}
