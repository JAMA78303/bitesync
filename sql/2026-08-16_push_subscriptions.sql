-- Web push subscriptions for the weekly-planning ritual reminders.
--
-- One row per browser/device (endpoint is the unique key the push service issues).
-- Users manage their own rows via RLS; the cron sender reads across users with the
-- service role, so no broad SELECT policy is granted to `authenticated`.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  -- Sunday "plan your week" nudge. On by default: it is the core weekly ritual.
  weekly_plan_reminder BOOLEAN NOT NULL DEFAULT true,
  -- Daily "log your meals" nudge. Off by default — opt in, it is far more frequent.
  daily_log_reminder BOOLEAN NOT NULL DEFAULT false,
  -- Send guards so a re-fired cron cannot double-notify on the same day.
  last_weekly_sent_on DATE,
  last_daily_sent_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_weekly_idx
  ON push_subscriptions (weekly_plan_reminder)
  WHERE weekly_plan_reminder = true;
CREATE INDEX IF NOT EXISTS push_subscriptions_daily_idx
  ON push_subscriptions (daily_log_reminder)
  WHERE daily_log_reminder = true;

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_select_own ON push_subscriptions;
CREATE POLICY push_subscriptions_select_own ON push_subscriptions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS push_subscriptions_insert_own ON push_subscriptions;
CREATE POLICY push_subscriptions_insert_own ON push_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS push_subscriptions_update_own ON push_subscriptions;
CREATE POLICY push_subscriptions_update_own ON push_subscriptions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS push_subscriptions_delete_own ON push_subscriptions;
CREATE POLICY push_subscriptions_delete_own ON push_subscriptions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON push_subscriptions TO authenticated;
GRANT ALL ON push_subscriptions TO service_role;
