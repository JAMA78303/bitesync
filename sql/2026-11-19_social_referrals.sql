-- Allow a sixth kind of row in ai_crawler_visits: 'social' — a person who
-- opened a BiteSync link shared on Facebook, Instagram, Messenger or Threads
-- (lib/analytics/socialReferrals.ts). Written by proxy.ts in production only;
-- the bot column holds the app's name, path the landing page, and user_agent
-- is left empty. No IP addresses, cookies, click IDs or user data.
-- Until this runs, those inserts are rejected and only logged as a warning.

ALTER TABLE public.ai_crawler_visits
  DROP CONSTRAINT IF EXISTS ai_crawler_visits_kind_check;

ALTER TABLE public.ai_crawler_visits
  ADD CONSTRAINT ai_crawler_visits_kind_check
  CHECK (kind IN ('referral', 'social', 'user', 'search', 'training', 'preview'));
