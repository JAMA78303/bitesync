ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_recipes_user_archived
ON public.recipes (user_id, archived_at);
