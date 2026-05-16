-- Favourite recipes for quick filtering in the library.
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS is_favourite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_recipes_user_favourite
  ON public.recipes (user_id, is_favourite)
  WHERE archived_at IS NULL AND is_favourite = true;

COMMENT ON COLUMN public.recipes.is_favourite IS 'User-marked favourite for quick access in recipe list';
