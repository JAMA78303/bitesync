ALTER TABLE public.basket_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'basket_snapshots'
      AND policyname = 'basket_snapshots_select_own'
  ) THEN
    CREATE POLICY basket_snapshots_select_own
      ON public.basket_snapshots
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'basket_snapshots'
      AND policyname = 'basket_snapshots_insert_own'
  ) THEN
    CREATE POLICY basket_snapshots_insert_own
      ON public.basket_snapshots
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'basket_snapshots'
      AND policyname = 'basket_snapshots_delete_own'
  ) THEN
    CREATE POLICY basket_snapshots_delete_own
      ON public.basket_snapshots
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

GRANT SELECT ON public.canonical_items TO anon, authenticated;
GRANT SELECT ON public.canonical_aliases TO anon, authenticated;
GRANT SELECT ON public.store_products TO anon, authenticated;
