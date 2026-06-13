-- Remove the supermarket price-comparison feature (Tesco/Asda/Aldi estimates).
-- The grocery list itself (grocery_items) is unaffected and stays.
--
-- These tables existed ONLY to power store price estimates / basket comparison,
-- which has been removed from the app. All app reads/writes to them are gone, so
-- they are now orphaned and safe to drop. Run this against the production project
-- after deploying the code change.
--
-- Drop order respects foreign keys; CASCADE covers any remaining dependent objects
-- (RLS policies, grants, indexes, views).

DROP TABLE IF EXISTS public.basket_snapshots CASCADE;
DROP TABLE IF EXISTS public.ingredient_price_matches CASCADE;
DROP TABLE IF EXISTS public.store_products CASCADE;
DROP TABLE IF EXISTS public.canonical_aliases CASCADE;
DROP TABLE IF EXISTS public.canonical_items CASCADE;
