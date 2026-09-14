-- Planned vs actual on the Today screen.
--
-- Until now the calorie ring showed what was planned, not what was eaten; the
-- tick on each Today card was a hardcoded `logged: false`. These two columns
-- let a user record a deviation from the plan. The plan stays the default
-- truth — an entry with neither set counts toward the day exactly as before —
-- so nothing changes for users who never log.
--
--   eaten_at   set when the user confirms they ate it (informational; the
--              entry already counted).
--   skipped_at set when the user did not eat it. The entry is excluded from
--              the day's totals. "Ate something else" is skipped_at on the
--              planned entry plus a quick-add entry for what replaced it.
--
-- Both nullable, both mutually exclusive in practice; the app clears one when
-- setting the other. Run in the Supabase SQL editor.

ALTER TABLE public.meal_plan_entries
  ADD COLUMN IF NOT EXISTS eaten_at timestamptz,
  ADD COLUMN IF NOT EXISTS skipped_at timestamptz;
