-- Waitlist for the halal and Ramadan features, collected at /halal and shown at
-- /admin/halal-waitlist. Two tables: sign-ups, and page visits so the sign-up
-- rate per video (?ref=) can be measured. No IP addresses or user agents.

CREATE TABLE IF NOT EXISTS public.halal_waitlist (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL UNIQUE,
  wants text CHECK (wants IN ('photo', 'halal', 'plans', 'ramadan')),
  ref text,
  country text
);

CREATE TABLE IF NOT EXISTS public.halal_waitlist_visits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seen_at timestamptz NOT NULL DEFAULT now(),
  ref text,
  country text
);

CREATE INDEX IF NOT EXISTS halal_waitlist_visits_seen_at_idx
  ON public.halal_waitlist_visits (seen_at DESC);

-- Row level security on with no policies: only the service role can read or
-- write. Grants are explicit because this project's service role does not get
-- table privileges by default.
ALTER TABLE public.halal_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halal_waitlist_visits ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.halal_waitlist TO service_role;
GRANT SELECT, INSERT ON public.halal_waitlist_visits TO service_role;
