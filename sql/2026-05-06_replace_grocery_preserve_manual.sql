-- Required for the function body below (also in 2026-04-30_flexible_input_and_selective_grocery.sql).
ALTER TABLE public.grocery_items
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;

-- Regenerate grocery list from recipes without archiving manual rows.
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
  UPDATE public.grocery_items
  SET archived_at = v_now
  WHERE meal_plan_id = p_meal_plan_id
    AND archived_at IS NULL
    AND COALESCE(is_manual, false) = false;

  INSERT INTO public.grocery_items (meal_plan_id, name, quantity, unit, is_checked, archived_at, is_manual)
  SELECT
    p_meal_plan_id,
    item->>'name',
    COALESCE((item->>'quantity')::numeric, 0),
    COALESCE(item->>'unit', ''),
    false,
    NULL,
    false
  FROM jsonb_array_elements(p_items) AS item;
END;
$$;
