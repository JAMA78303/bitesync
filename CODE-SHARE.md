# BITESYNC MVP Code Share

This document is a shareable overview of the BiteSync implementation state, including architecture, key features, and the main files to review.

## Stack

- Next.js 16 (App Router)
- TypeScript
- Supabase (Auth + Postgres + RLS)
- Tailwind CSS
- React Hook Form + Zod (TDEE form)

## Implemented Features

- Authentication: signup, login, reset password, callback exchange
- Protected routing and auth redirects
- Weekly planner with meal slots (including `snack`)
- Recipe create/edit/delete
- Recipe archive/restore workflow (soft archive)
- Ingredient autocomplete in recipe forms
- Grocery generation from planner entries
- Grocery checklist with progress and optimistic toggle
- TDEE calculation and profile target saving
- Settings page with Pro-gated TDEE UI

## Key Files

### Core App

- `app/(app)/planner/page.tsx`
- `app/(app)/recipes/page.tsx`
- `app/(app)/recipes/[id]/page.tsx`
- `app/(app)/grocery/page.tsx`
- `app/(app)/settings/page.tsx`
- `proxy.ts`

### Supabase/Data Logic

- `lib/supabase/meal-plans.ts`
- `lib/supabase/grocery.ts`
- `lib/supabase/profile.ts`
- `app/(app)/recipes/actions.ts`

### Components

- `components/planner/PlannerGrid.tsx`
- `components/planner/DailyTotalsRow.tsx`
- `components/planner/RecipePickerModal.tsx`
- `components/grocery/GroceryItem.tsx`
- `components/grocery/GroceryHeader.tsx`
- `components/settings/TDEEForm.tsx`

### Shared Types/Utils

- `types/index.ts`
- `lib/utils/tdee.ts`
- `lib/utils/dates.ts`
- `lib/utils/merge.ts`

### SQL Migrations

- `sql/2026-04-29_full_mvp_tdee.sql`
- `sql/2026-04-29_recipes_archive.sql`

## Representative Implementation Snippets

### 1) Planner meal types include snack

```ts
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";
export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
```

### 2) Archive recipe action

```ts
export async function archiveRecipe(recipeId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("recipes")
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", recipeId)
    .eq("user_id", user.id);

  revalidatePath("/recipes");
  revalidatePath("/planner");
  redirect("/recipes");
}
```

### 3) Grocery generation via RPC

```ts
const { error } = await supabase.rpc("replace_grocery_items", {
  p_meal_plan_id: meal_plan_id,
  p_items: merged,
});
if (error) return { error: error.message };
```

### 4) TDEE server-side save

```ts
const result = calculateNutritionTargets(values);
await supabase
  .from("profiles")
  .update({
    daily_calorie_target: result.dailyCalories,
    daily_protein_target: result.dailyProtein,
  })
  .eq("id", user.id);
```

## Run Locally

```bash
cd "<project-root>"
npm install
npm run dev
```

Production test:

```bash
npm run build
npm run start
```

## Notes for Reviewers

- Archiving is implemented as soft state (`archived_at`) and filtered from active flows.
- Planner totals support optional profile targets (kcal/protein).
- Grocery checklist remains interactive even when all items are checked.
- `proxy.ts` is used for route protection (Next 16 convention).
