-- Every week-plan run, recorded.
--
-- For a week the only evidence of what the AI planner did was a toast on the
-- user's phone. Five fixes went out on inference. This table records each
-- run: what was asked for, what happened, how long each phase took, what the
-- model call cost in tokens, and the error if there was one — so a failure
-- can be read from the database rather than asked about.
--
-- Written by the user's own session (RLS: insert and read your own rows).
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.plan_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id  uuid,
  requested     text NOT NULL CHECK (requested IN ('ai', 'heuristic')),
  outcome       text NOT NULL CHECK (outcome IN ('claude', 'heuristic', 'heuristic_fallback', 'error')),
  total_ms      integer,
  claude_ms     integer,
  apply_ms      integer,
  model         text,
  input_tokens  integer,
  output_tokens integer,
  cache_read_tokens integer,
  stop_reason   text,
  recipe_pool   integer,
  fallback_notice text,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_runs_user_created_idx ON public.plan_runs (user_id, created_at DESC);

ALTER TABLE public.plan_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_runs insert own" ON public.plan_runs;
CREATE POLICY "plan_runs insert own" ON public.plan_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "plan_runs select own" ON public.plan_runs;
CREATE POLICY "plan_runs select own" ON public.plan_runs
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT, INSERT ON public.plan_runs TO authenticated;
GRANT SELECT, INSERT ON public.plan_runs TO service_role;
