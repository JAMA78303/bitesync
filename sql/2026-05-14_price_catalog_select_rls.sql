-- Reference price tables must be readable by the Supabase API (anon + authenticated).
-- If RLS is enabled with no SELECT policy, PostgREST returns zero rows and the app thinks the catalogue is empty.

ALTER TABLE public.canonical_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS canonical_items_select_all ON public.canonical_items;
CREATE POLICY canonical_items_select_all ON public.canonical_items FOR SELECT USING (true);

ALTER TABLE public.canonical_aliases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS canonical_aliases_select_all ON public.canonical_aliases;
CREATE POLICY canonical_aliases_select_all ON public.canonical_aliases FOR SELECT USING (true);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS store_products_select_all ON public.store_products;
CREATE POLICY store_products_select_all ON public.store_products FOR SELECT USING (true);
