CREATE TABLE IF NOT EXISTS public.store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store text NOT NULL,
  product_name text NOT NULL,
  canonical_item_id uuid NULL REFERENCES public.canonical_items(id) ON DELETE SET NULL,
  size_value numeric NOT NULL,
  size_unit text NOT NULL,
  price_gbp numeric(10,2) NOT NULL,
  unit_price_gbp numeric(10,4) NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  product_url text NULL,
  barcode text NULL,
  price_volatility text NOT NULL DEFAULT 'medium',
  confidence numeric(5,2) NOT NULL DEFAULT 0.70,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_products_store_item_idx
ON public.store_products (store, canonical_item_id);

CREATE INDEX IF NOT EXISTS store_products_store_last_seen_idx
ON public.store_products (store, last_seen_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS store_products_store_barcode_unique_idx
ON public.store_products (store, barcode)
WHERE barcode IS NOT NULL;
