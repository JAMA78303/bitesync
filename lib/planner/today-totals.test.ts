import { sumTodayTotals, type TodayMeal } from "@/lib/planner/today";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

const meal = (
  id: string,
  status: TodayMeal["status"],
  kcal: number,
  protein: number,
): TodayMeal => ({
  id,
  mealPlanId: "plan",
  dayOfWeek: 0,
  mealType: "lunch",
  slotIndex: 0,
  status,
  logged: status === "eaten",
  servingLabel: null,
  recipe: { id: `r-${id}`, name: id, kcal, protein, carbs: 0, fat: 0, fibre: 0, imageUrl: null },
  quickAddName: null,
  quickAddCalories: null,
});

/**
 * The plan is the default truth. A user who never logs must see exactly what
 * they saw before this feature existed: every planned meal counted. Only a
 * recorded skip moves the numbers; confirming "eaten" changes nothing, because
 * the meal already counted.
 */
{
  const planned = [meal("a", "planned", 500, 30), meal("b", "planned", 700, 40)];
  const t = sumTodayTotals(planned);
  assert(t.kcal === 1200 && t.protein === 70, `planned-only day should total 1200/70, got ${t.kcal}/${t.protein}`);
}

{
  const confirmed = [meal("a", "eaten", 500, 30), meal("b", "planned", 700, 40)];
  const t = sumTodayTotals(confirmed);
  assert(t.kcal === 1200, `marking a meal eaten must not change the total; got ${t.kcal}`);
}

{
  const withSkip = [meal("a", "eaten", 500, 30), meal("b", "skipped", 700, 40)];
  const t = sumTodayTotals(withSkip);
  assert(t.kcal === 500 && t.protein === 30, `skipped meal must be excluded; got ${t.kcal}/${t.protein}`);
}

{
  // Quick-add replacement counts by its own calories, without a recipe.
  const replaced: TodayMeal[] = [
    meal("a", "skipped", 700, 40),
    {
      ...meal("qa", "planned", 0, 0),
      recipe: null,
      quickAddName: "Leftover curry",
      quickAddCalories: 620,
    },
  ];
  const t = sumTodayTotals(replaced);
  assert(t.kcal === 620, `"ate something else" should count the replacement only; got ${t.kcal}`);
}

console.log("today-totals.test.ts: all assertions passed");
