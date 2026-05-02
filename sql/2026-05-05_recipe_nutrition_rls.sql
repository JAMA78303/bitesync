-- Ensures authenticated users can SELECT/INSERT/UPDATE recipe_nutrition for their own recipes.
-- Apply if the app cannot read or upsert nutrition rows (RLS blocking).

ALTER TABLE public.recipe_nutrition ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipe_nutrition_select_own" ON public.recipe_nutrition;
CREATE POLICY "recipe_nutrition_select_own"
ON public.recipe_nutrition
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_nutrition.recipe_id
      AND r.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "recipe_nutrition_insert_own" ON public.recipe_nutrition;
CREATE POLICY "recipe_nutrition_insert_own"
ON public.recipe_nutrition
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_nutrition.recipe_id
      AND r.user_id = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "recipe_nutrition_update_own" ON public.recipe_nutrition;
CREATE POLICY "recipe_nutrition_update_own"
ON public.recipe_nutrition
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_nutrition.recipe_id
      AND r.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.recipes r
    WHERE r.id = recipe_nutrition.recipe_id
      AND r.user_id = (SELECT auth.uid())
  )
);
