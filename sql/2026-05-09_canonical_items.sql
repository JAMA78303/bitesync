CREATE TABLE IF NOT EXISTS public.canonical_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  default_unit text NOT NULL,
  is_vegan boolean NOT NULL DEFAULT false,
  is_vegetarian boolean NOT NULL DEFAULT false,
  is_gluten_free boolean NOT NULL DEFAULT false,
  is_dairy_free boolean NOT NULL DEFAULT false,
  common_allergens text[] NOT NULL DEFAULT '{}',
  barcode text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS canonical_items_barcode_unique_idx
ON public.canonical_items (barcode)
WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS canonical_items_name_idx
ON public.canonical_items (name);

CREATE INDEX IF NOT EXISTS canonical_items_allergens_gin_idx
ON public.canonical_items
USING gin (common_allergens);
