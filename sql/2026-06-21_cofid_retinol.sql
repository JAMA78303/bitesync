-- Preformed retinol (µg per 100g) — separate from retinol equivalents for upper-limit checks.
ALTER TABLE public.cofid_foods
  ADD COLUMN IF NOT EXISTS retinol_ug numeric;

COMMENT ON COLUMN public.cofid_foods.retinol_ug IS
  'Preformed retinol (µg/100g). vitamin_a_ug remains total retinol equivalents (RE).';
