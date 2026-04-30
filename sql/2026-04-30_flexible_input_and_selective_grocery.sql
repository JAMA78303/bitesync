-- Quick add meals (no recipe required)
ALTER TABLE meal_plan_entries
ADD COLUMN IF NOT EXISTS quick_add_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS quick_add_calories INTEGER DEFAULT NULL;

-- Make recipe_id optional (NULL for quick add entries)
ALTER TABLE meal_plan_entries
ALTER COLUMN recipe_id DROP NOT NULL;

-- Add constraint: must have either recipe_id OR quick_add_name
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'entry_has_content'
  ) THEN
    ALTER TABLE meal_plan_entries
    ADD CONSTRAINT entry_has_content CHECK (
      recipe_id IS NOT NULL OR quick_add_name IS NOT NULL
    );
  END IF;
END
$$;

-- Manual grocery items flag
ALTER TABLE grocery_items
ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT FALSE;
