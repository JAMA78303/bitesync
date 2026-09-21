-- A run that stalls never reaches the end-of-run insert, so it left no row.
-- Insert at the start instead and stamp each phase as it passes; a stalled
-- run then shows as 'running' with the phase it stopped in.
ALTER TABLE public.plan_runs
  ADD COLUMN IF NOT EXISTS phase text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.plan_runs DROP CONSTRAINT IF EXISTS plan_runs_outcome_check;
ALTER TABLE public.plan_runs ADD CONSTRAINT plan_runs_outcome_check
  CHECK (outcome IN ('running', 'claude', 'heuristic', 'heuristic_fallback', 'error'));

DROP POLICY IF EXISTS "plan_runs update own" ON public.plan_runs;
CREATE POLICY "plan_runs update own" ON public.plan_runs
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
GRANT UPDATE ON public.plan_runs TO authenticated;
