-- Snacks per day as a user preference.
--
-- The planner decided this for everyone with one line: two snacks if the
-- calorie target is 2200 or more, otherwise one. Meal frequency is individual
-- — three meals and a snack is a fine day, and so is three meals and two —
-- so it should be chosen, not inferred from calories.
--
-- Nullable. NULL keeps the old rule, so nothing changes for anyone who has
-- not set it. 1 or 2 for now: those are the slot layouts the planner sizes
-- mains around. Zero (no snacks) needs its own layout and is a follow-up.
-- Run in the Supabase SQL editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS snacks_per_day smallint
  CHECK (snacks_per_day IS NULL OR snacks_per_day BETWEEN 1 AND 2);
