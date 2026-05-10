-- Imported recipe servings metadata + per-ingredient AI nutrition flag.

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS detected_servings integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cooking_for integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.recipes.detected_servings IS 'Servings/yield parsed from source recipe (e.g. JSON-LD recipeYield)';
COMMENT ON COLUMN public.recipes.cooking_for IS 'How many people quantities were scaled for at import';

ALTER TABLE public.recipe_ingredients
  ADD COLUMN IF NOT EXISTS nutrition_estimated boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.recipe_ingredients.nutrition_estimated IS 'True when macros for this line came from AI estimation';
