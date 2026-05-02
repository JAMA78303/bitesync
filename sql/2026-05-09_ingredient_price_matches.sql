CREATE TABLE IF NOT EXISTS public.ingredient_price_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name text NOT NULL,
  canonical_item_id uuid NOT NULL REFERENCES public.canonical_items(id) ON DELETE CASCADE,
  confidence numeric(5,2) NOT NULL,
  match_method text NOT NULL,
  verified_by_user boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ingredient_name, canonical_item_id, match_method)
);

CREATE INDEX IF NOT EXISTS ingredient_price_matches_name_idx
ON public.ingredient_price_matches (lower(ingredient_name));
