-- Product events (first run, week planned, upgrade prompts, photo logging,
-- purchases), stored in our own database.
--
-- Until now lib/analytics/events.ts sent these to Vercel Analytics with
-- track(). Vercel only records custom events on its paid plans, and BiteSync
-- is on the free plan, so none of them were being kept. Written by
-- /api/events and lib/analytics/recordAppEvent.ts in production only, and
-- shown at /admin/events.
--
-- What's stored: the event name, a few small properties (never free text the
-- user typed), the signed-in user's id if there is one, and web or ios.

CREATE TABLE IF NOT EXISTS public.app_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 64),
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  platform text CHECK (platform IN ('web', 'ios'))
);

CREATE INDEX IF NOT EXISTS app_events_created_at_idx
  ON public.app_events (created_at DESC);

CREATE INDEX IF NOT EXISTS app_events_name_created_at_idx
  ON public.app_events (name, created_at DESC);

-- Row level security on with no policies: only the service role can read or
-- write. Grants are explicit because this project's service role does not get
-- table privileges by default.
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.app_events TO service_role;
