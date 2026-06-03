"use client";

import { MealMatchSuggestions } from "@/components/matching/MealMatchSuggestions";
import { suggestMealsFromLeftovers } from "@/app/(app)/pantry/actions";

type Props = {
  mealPlanId: string;
  uncheckedCount: number;
};

export function LeftoverSuggestionsPanel({ mealPlanId, uncheckedCount }: Props) {
  if (uncheckedCount === 0) return null;

  return (
    <MealMatchSuggestions
      title="Use leftovers"
      sourceLabel={`${uncheckedCount} unchecked item${uncheckedCount === 1 ? "" : "s"} on your list`}
      emptyHint="Suggest recipes that use ingredients still on your grocery list (unchecked only)."
      onSuggest={async () => {
        const result = await suggestMealsFromLeftovers(mealPlanId);
        if ("error" in result) return { error: result.error };
        return { data: result.data };
      }}
    />
  );
}
