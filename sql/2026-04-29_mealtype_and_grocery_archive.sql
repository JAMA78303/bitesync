-- Task A: meal_type CHECK update (add snack)
ALTER TABLE public.meal_plan_entries
DROP CONSTRAINT IF EXISTS meal_plan_entries_meal_type_check;

ALTER TABLE public.meal_plan_entries
ADD CONSTRAINT meal_plan_entries_meal_type_check
CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));

-- Task B: soft-delete support for grocery history
ALTER TABLE public.grocery_items
ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE INDEX IF NOT EXISTS grocery_items_meal_plan_archived_idx
ON public.grocery_items (meal_plan_id, archived_at);

-- Archive old rows, then insert a new active snapshot.
CREATE OR REPLACE FUNCTION public.replace_grocery_items(
  p_meal_plan_id uuid,
  p_items jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  -- Archive currently active rows first.
  UPDATE public.grocery_items
  SET archived_at = v_now
  WHERE meal_plan_id = p_meal_plan_id
    AND archived_at IS NULL;

  -- Insert the next active list.
  INSERT INTO public.grocery_items (meal_plan_id, name, quantity, unit, is_checked, archived_at)
  SELECT
    p_meal_plan_id,
    item->>'name',
    COALESCE((item->>'quantity')::numeric, 0),
    item->>'unit',
    false,
    NULL
  FROM jsonb_array_elements(p_items) AS item;
END;
$$;
