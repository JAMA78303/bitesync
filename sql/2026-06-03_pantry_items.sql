-- Per-user pantry / kitchen inventory for "cook from what I have".

CREATE TABLE IF NOT EXISTS public.pantry_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  quantity     numeric,
  unit         text NOT NULL DEFAULT '',
  running_low  boolean NOT NULL DEFAULT false,
  archived_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pantry_items_user_active_idx
  ON public.pantry_items (user_id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS pantry_items_user_name_idx
  ON public.pantry_items (user_id, lower(name))
  WHERE archived_at IS NULL;

COMMENT ON TABLE public.pantry_items IS 'User pantry inventory for cook-from-what-I-have matching';

ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pantry_items_select_own ON public.pantry_items;
CREATE POLICY pantry_items_select_own
  ON public.pantry_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS pantry_items_insert_own ON public.pantry_items;
CREATE POLICY pantry_items_insert_own
  ON public.pantry_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS pantry_items_update_own ON public.pantry_items;
CREATE POLICY pantry_items_update_own
  ON public.pantry_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS pantry_items_delete_own ON public.pantry_items;
CREATE POLICY pantry_items_delete_own
  ON public.pantry_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pantry_items TO authenticated;
