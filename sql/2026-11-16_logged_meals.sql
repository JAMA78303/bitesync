-- Meals logged from a photo ("Snap a meal" on Today).
--
-- A logged meal is a meal_plan_entries row in quick-add form (quick_add_name,
-- quick_add_calories), so everything that already understands quick-adds
-- shows it and counts its calories: Today, the planner, the week's numbers.
-- Being a quick-add, it never reaches the grocery list or the recipe library.
--
-- These two tables hold what a quick-add can't: the foods and grams the user
-- confirmed, and the nutrition worked out from them (DEC-004: nutrition comes
-- from the stored ingredients). Today adds the protein, carbs, fat and fibre;
-- the weekly vitamin and mineral check reads the ingredients.
--
-- Deleting the entry deletes the logged meal and its ingredients. No photo is
-- stored anywhere.

CREATE TABLE IF NOT EXISTS public.logged_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  meal_plan_entry_id uuid NOT NULL UNIQUE REFERENCES public.meal_plan_entries (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  source text NOT NULL DEFAULT 'photo' CHECK (source IN ('photo')),
  calories numeric NOT NULL DEFAULT 0,
  protein_g numeric NOT NULL DEFAULT 0,
  carbs_g numeric NOT NULL DEFAULT 0,
  fat_g numeric NOT NULL DEFAULT 0,
  fibre_g numeric NOT NULL DEFAULT 0,
  sugar_g numeric NOT NULL DEFAULT 0,
  sodium_mg numeric NOT NULL DEFAULT 0,
  saturated_fat_g numeric NOT NULL DEFAULT 0,
  -- Share of the foods matched to nutrition data. Below 100, the totals are
  -- a floor: an unmatched food is unknown, not zero (DEC-005).
  coverage_pct numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS logged_meals_user_created_idx
  ON public.logged_meals (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.logged_meal_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logged_meal_id uuid NOT NULL REFERENCES public.logged_meals (id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL DEFAULT 'g',
  matched boolean NOT NULL DEFAULT false,
  cofid_food_name text,
  cofid_matched_by text
);

CREATE INDEX IF NOT EXISTS logged_meal_ingredients_meal_idx
  ON public.logged_meal_ingredients (logged_meal_id, position);

-- Each person sees and changes only their own logged meals.
ALTER TABLE public.logged_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logged_meal_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS logged_meals_own ON public.logged_meals;
CREATE POLICY logged_meals_own ON public.logged_meals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  -- …and only on an entry in one of their own plans.
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.meal_plan_entries e
      JOIN public.meal_plans p ON p.id = e.meal_plan_id
      WHERE e.id = meal_plan_entry_id AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS logged_meal_ingredients_own ON public.logged_meal_ingredients;
CREATE POLICY logged_meal_ingredients_own ON public.logged_meal_ingredients
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.logged_meals m WHERE m.id = logged_meal_id AND m.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.logged_meals m WHERE m.id = logged_meal_id AND m.user_id = auth.uid()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.logged_meals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.logged_meal_ingredients TO authenticated;
-- Account deletion and admin checks run as the service role.
GRANT SELECT, DELETE ON public.logged_meals TO service_role;
GRANT SELECT, DELETE ON public.logged_meal_ingredients TO service_role;
