-- First-run onboarding progress and in-app feedback

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 1;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_run_completed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_run_skipped BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.onboarding_step IS '1=goal, 2=library, 3=week, 4=done';
COMMENT ON COLUMN profiles.first_run_completed IS 'True when user finishes all 3 guided steps';
COMMENT ON COLUMN profiles.first_run_skipped IS 'True when user skips the guided flow';

-- Existing users already onboarded — mark first run complete
UPDATE profiles
SET
  onboarding_step = 4,
  first_run_completed = TRUE,
  first_run_skipped = FALSE
WHERE has_completed_onboarding = TRUE;

CREATE TABLE IF NOT EXISTS feedback_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  screen TEXT NOT NULL,
  message TEXT NOT NULL,
  expected TEXT,
  app_version TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE feedback_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY feedback_insert_own ON feedback_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

GRANT INSERT ON feedback_submissions TO authenticated;
