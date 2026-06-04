-- Fix PostgREST 42501: permission denied for table recipes (macro recompute / admin)
-- Run once in Supabase → SQL Editor.
-- Also verify Vercel SUPABASE_SERVICE_ROLE_KEY is the service_role secret (JWT eyJ…),
-- not the anon key and not a mis-labelled publishable key.

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.recipes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.recipe_ingredients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.recipe_nutrition TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_plans TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.meal_plan_entries TO service_role;

GRANT SELECT ON TABLE public.cofid_foods TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cofid_overrides TO service_role;
