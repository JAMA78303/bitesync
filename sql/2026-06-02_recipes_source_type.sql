ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS source_type text;

COMMENT ON COLUMN public.recipes.source_type IS 'Import origin: recipe_blog, tiktok, instagram, facebook, unknown';
