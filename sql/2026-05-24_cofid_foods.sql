-- McCance & Widdowson CoFID 2021 reference foods (per 100g). Import via scripts/import-cofid.ts.

CREATE TABLE IF NOT EXISTS public.cofid_foods (
  id              serial PRIMARY KEY,
  food_code       text UNIQUE NOT NULL,
  food_name       text NOT NULL,
  food_group      text,

  kcal            numeric,
  protein_g       numeric,
  fat_g           numeric,
  carbs_g         numeric,
  sugars_g        numeric,
  fibre_g         numeric,
  sodium_mg       numeric,
  salt_g          numeric,

  vitamin_a_ug    numeric,
  vitamin_d_ug    numeric,
  vitamin_e_mg    numeric,
  vitamin_k_ug    numeric,
  vitamin_c_mg    numeric,
  thiamin_mg      numeric,
  riboflavin_mg   numeric,
  niacin_mg       numeric,
  vitamin_b6_mg   numeric,
  vitamin_b12_ug  numeric,
  folate_ug       numeric,

  calcium_mg      numeric,
  iron_mg         numeric,
  zinc_mg         numeric,
  magnesium_mg    numeric,
  potassium_mg    numeric,
  phosphorus_mg   numeric,
  selenium_ug     numeric,
  iodine_ug       numeric,

  search_vector   tsvector GENERATED ALWAYS AS (
    to_tsvector('english', food_name)
  ) STORED,

  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cofid_foods_search_idx
  ON public.cofid_foods USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS cofid_foods_name_idx
  ON public.cofid_foods (food_name);

ALTER TABLE public.cofid_foods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cofid_foods_select_authenticated ON public.cofid_foods;
CREATE POLICY cofid_foods_select_authenticated
  ON public.cofid_foods FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.cofid_foods TO authenticated;

-- CoFID match metadata on recipe ingredients (for approximate-match UI)
ALTER TABLE public.recipe_ingredients
  ADD COLUMN IF NOT EXISTS cofid_food_name text,
  ADD COLUMN IF NOT EXISTS cofid_matched_by text;

COMMENT ON COLUMN public.recipe_ingredients.cofid_food_name IS 'Matched CoFID food name when nutrition came from cofid_foods';
COMMENT ON COLUMN public.recipe_ingredients.cofid_matched_by IS 'exact | fulltext | partial — how the CoFID row was matched';
