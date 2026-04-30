-- Add snack meal type
ALTER TABLE meal_plan_entries
DROP CONSTRAINT IF EXISTS meal_plan_entries_meal_type_check;

ALTER TABLE meal_plan_entries
ADD CONSTRAINT meal_plan_entries_meal_type_check
CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack'));

-- Ensure unique constraint exists
ALTER TABLE meal_plan_entries
ADD CONSTRAINT IF NOT EXISTS meal_plan_entries_unique
UNIQUE (meal_plan_id, day_of_week, meal_type);

-- Add soft delete to grocery items
ALTER TABLE grocery_items
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Add TDEE fields to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weight_kg NUMERIC,
ADD COLUMN IF NOT EXISTS height_cm NUMERIC,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS sex TEXT CHECK (sex IN ('male', 'female')),
ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IN (
  'sedentary', 'light', 'moderate', 'active', 'extra_active'
)),
ADD COLUMN IF NOT EXISTS goal TEXT CHECK (goal IN ('lose', 'maintain', 'gain')),
ADD COLUMN IF NOT EXISTS daily_calorie_target INTEGER,
ADD COLUMN IF NOT EXISTS daily_protein_target INTEGER;

-- Update RPC to archive instead of hard delete
CREATE OR REPLACE FUNCTION replace_grocery_items(
  p_meal_plan_id UUID,
  p_items JSONB
) RETURNS void AS $$
BEGIN
  UPDATE grocery_items
  SET archived_at = now()
  WHERE meal_plan_id = p_meal_plan_id
    AND archived_at IS NULL;

  INSERT INTO grocery_items (meal_plan_id, name, quantity, unit, is_checked)
  SELECT
    p_meal_plan_id,
    item->>'name',
    (item->>'quantity')::numeric,
    item->>'unit',
    false
  FROM jsonb_array_elements(p_items) AS item;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start ON meal_plans(week_start_date);
CREATE INDEX IF NOT EXISTS idx_meal_plan_entries_plan_id ON meal_plan_entries(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_plan_id ON grocery_items(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_grocery_items_archived ON grocery_items(archived_at);
