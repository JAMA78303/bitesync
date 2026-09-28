-- Let a day hold more than one snack — for real this time.
--
-- 2026-05-10_unlimited_snacks_slot_index.sql replaced the old rule "one entry
-- per meal type per day" with "one entry per slot", but it dropped the old
-- rule by two guessed names. The real one had a different name, so both rules
-- have been live since, and any day with a second snack is refused.
--
-- The planner then falls back to saving one snack per day (the lowest slot),
-- after it has already balanced the day's calories and protein around two.
-- On a real AI-planned week that left Wednesday at 127 g protein against a
-- 142 g target: the planner had counted a second, egg-based snack that was
-- never saved. It affects everyone on two snacks a day — the default for
-- calorie targets of 2200 kcal or more — and adding a second snack by hand
-- fails for the same reason.
--
-- This drops any unique constraint or unique index on exactly
-- (meal_plan_id, day_of_week, meal_type), whatever it is called, and leaves
-- meal_plan_entries_meal_slot_unique (… , slot_index) in place. Safe to run
-- more than once.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT i.indexrelid::regclass::text AS index_name, con.conname
    FROM pg_index i
    LEFT JOIN pg_constraint con
      ON con.conindid = i.indexrelid AND con.conrelid = i.indrelid
    WHERE i.indrelid = 'public.meal_plan_entries'::regclass
      AND i.indisunique
      AND NOT i.indisprimary
      AND (
        SELECT array_agg(a.attname::text ORDER BY a.attname::text)
        FROM unnest(i.indkey::int2[]) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum
      ) = ARRAY['day_of_week', 'meal_plan_id', 'meal_type']
  LOOP
    IF r.conname IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.meal_plan_entries DROP CONSTRAINT %I', r.conname);
      RAISE NOTICE 'Dropped constraint %', r.conname;
    ELSE
      EXECUTE format('DROP INDEX %s', r.index_name);
      RAISE NOTICE 'Dropped index %', r.index_name;
    END IF;
  END LOOP;
END $$;

-- The per-slot rule the app relies on (already present; kept for a fresh database).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.meal_plan_entries'::regclass
      AND conname = 'meal_plan_entries_meal_slot_unique'
  ) THEN
    ALTER TABLE public.meal_plan_entries
      ADD CONSTRAINT meal_plan_entries_meal_slot_unique
      UNIQUE (meal_plan_id, day_of_week, meal_type, slot_index);
  END IF;
END $$;

-- What is left: expect meal_plan_entries_meal_slot_unique and the primary key only.
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.meal_plan_entries'::regclass
  AND contype IN ('u', 'p');
