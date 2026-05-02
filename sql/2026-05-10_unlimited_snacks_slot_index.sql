-- Allow multiple entries per day for the same meal type (used for unlimited snacks).
ALTER TABLE public.meal_plan_entries
ADD COLUMN IF NOT EXISTS slot_index integer NOT NULL DEFAULT 0;

-- Backfill safety (in case old rows exist with null via legacy imports).
UPDATE public.meal_plan_entries
SET slot_index = 0
WHERE slot_index IS NULL;

-- Replace older uniqueness so entries can coexist by slot.
ALTER TABLE public.meal_plan_entries
DROP CONSTRAINT IF EXISTS meal_plan_entries_unique;

ALTER TABLE public.meal_plan_entries
DROP CONSTRAINT IF EXISTS meal_plan_entries_meal_slot_unique;

ALTER TABLE public.meal_plan_entries
ADD CONSTRAINT meal_plan_entries_meal_slot_unique
UNIQUE (meal_plan_id, day_of_week, meal_type, slot_index);

CREATE INDEX IF NOT EXISTS meal_plan_entries_day_meal_slot_idx
ON public.meal_plan_entries (meal_plan_id, day_of_week, meal_type, slot_index);
