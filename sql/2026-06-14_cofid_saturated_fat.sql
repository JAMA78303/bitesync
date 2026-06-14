-- Saturated fatty acids per 100g from CoFID (McCance & Widdowson "1.3 Proximates").
-- The original import dropped this column; re-run scripts/import-cofid.ts after applying
-- this migration to populate it. Until then the value is NULL (unknown, never a fake 0).

ALTER TABLE public.cofid_foods
  ADD COLUMN IF NOT EXISTS saturated_fat_g numeric;

COMMENT ON COLUMN public.cofid_foods.saturated_fat_g IS
  'Saturated fatty acids per 100g (CoFID "Satd FA /100g"). NULL = no source value (unknown), not zero.';
