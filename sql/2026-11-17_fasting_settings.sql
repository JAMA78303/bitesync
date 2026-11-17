-- Ramadan mode and other fasting days (Settings → Ramadan & fasting).
--
-- One row per person. Until this runs, the app behaves exactly as before:
-- reads fall back to "no fasting days" (lib/fasting/server.ts) and saving
-- says Ramadan mode isn't available yet.
--
-- Health data, kept to the minimum: the safety screen ("diabetes treated with
-- medicine, pregnant or breastfeeding, under 18, an eating disorder, kidney
-- disease") stores only whether anything was ticked (no_deficit), never which.

CREATE TABLE IF NOT EXISTS public.fasting_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  ramadan_on boolean NOT NULL DEFAULT false,
  -- The person's own dates for their local moon sighting; null = the expected
  -- Umm al-Qura dates.
  ramadan_start date,
  ramadan_end date,
  -- Single fasting days ("Fasting today", six of Shawwal, Arafah, Ashura, any date).
  extra_days date[] NOT NULL DEFAULT '{}',
  -- Repeating fasts by weekday: 0 = Monday … 6 = Sunday.
  weekly_days smallint[] NOT NULL DEFAULT '{}',
  -- Where prayer times are worked out for: a city from the list or the
  -- phone's location, rounded to two decimals (about 1 km) by the app.
  place_name text CHECK (place_name IS NULL OR char_length(place_name) <= 80),
  latitude double precision CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  longitude double precision CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
  time_zone text NOT NULL DEFAULT 'Europe/London' CHECK (char_length(time_zone) <= 64),
  method text NOT NULL DEFAULT 'mwl' CHECK (char_length(method) <= 20),
  fajr_offset_minutes smallint NOT NULL DEFAULT 0 CHECK (fajr_offset_minutes BETWEEN -30 AND 30),
  maghrib_offset_minutes smallint NOT NULL DEFAULT 0 CHECK (maghrib_offset_minutes BETWEEN -30 AND 30),
  no_deficit boolean NOT NULL DEFAULT false,
  safety_checked_at timestamptz,
  suhoor_reminder boolean NOT NULL DEFAULT true,
  iftar_plan_reminder boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fasting_settings_ramadan_dates CHECK (
    (ramadan_start IS NULL AND ramadan_end IS NULL)
    OR (ramadan_start IS NOT NULL AND ramadan_end IS NOT NULL AND ramadan_start <= ramadan_end)
  ),
  CONSTRAINT fasting_settings_extra_days_size CHECK (cardinality(extra_days) <= 120)
);

-- Each person sees and changes only their own row.
ALTER TABLE public.fasting_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS fasting_settings_own ON public.fasting_settings;
CREATE POLICY fasting_settings_own ON public.fasting_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fasting_settings TO authenticated;
-- Account deletion and admin checks run as the service role.
GRANT SELECT, DELETE ON public.fasting_settings TO service_role;
