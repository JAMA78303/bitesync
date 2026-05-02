-- basket_snapshots had RLS but no GRANTs for the API role → "permission denied for table basket_snapshots"
GRANT SELECT, INSERT, DELETE ON public.basket_snapshots TO authenticated;
GRANT ALL ON public.basket_snapshots TO service_role;
