-- Permanent ingredient name → CoFID food_code mappings (checked before fuzzy match).

CREATE TABLE IF NOT EXISTS public.cofid_overrides (
  id              serial PRIMARY KEY,
  ingredient_name text UNIQUE NOT NULL,
  food_code       text NOT NULL REFERENCES public.cofid_foods(food_code) ON DELETE CASCADE,
  note            text,
  created_at      timestamptz DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS cofid_overrides_name_idx
  ON public.cofid_overrides (ingredient_name);

ALTER TABLE public.cofid_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cofid_overrides_select_authenticated ON public.cofid_overrides;
CREATE POLICY cofid_overrides_select_authenticated
  ON public.cofid_overrides FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.cofid_overrides TO authenticated;

-- Seed rows live in sql/2026-05-24_cofid_overrides_seed.sql
-- Run ONLY after cofid_foods is populated (npm run import:cofid).
