-- Structured cooking steps + traceable recipe source for AI/hybrid generation.
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS method_steps jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS recipe_source text;

COMMENT ON COLUMN public.recipes.method_steps IS 'Ordered JSON array of method step strings for cooking mode';
COMMENT ON COLUMN public.recipes.recipe_source IS 'ai | generated | import | null for user-authored';
