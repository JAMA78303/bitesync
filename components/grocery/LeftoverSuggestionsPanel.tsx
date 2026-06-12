"use client";

import { MealMatchSuggestions } from "@/components/matching/MealMatchSuggestions";
import { suggestMealsFromLeftovers } from "@/app/(app)/pantry/actions";

type Props = {
 mealPlanId: string;
 checkedCount: number;
};

export function LeftoverSuggestionsPanel({ mealPlanId, checkedCount }: Props) {
 if (checkedCount === 0) return null;

 return (
 <MealMatchSuggestions
 title="Use leftovers"
 sourceLabel={`${checkedCount} item${checkedCount === 1 ?"" :"s"} in your basket`}
 emptyHint="Suggest extra recipes from ingredients you've already bought."
 onSuggest={async () => {
 const result = await suggestMealsFromLeftovers(mealPlanId);
 if ("error" in result) return { error: result.error };
 return { data: result.data };
 }}
 />
 );
}
