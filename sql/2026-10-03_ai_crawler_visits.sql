-- One row per page read by an AI assistant, search engine or link-preview bot.
-- Written by proxy.ts (lib/analytics/recordCrawlerVisit.ts) in production only,
-- and shown at /admin/ai-visits. No IP addresses or user data: the bot's name,
-- what kind of visit it was, the page path and the bot's User-Agent.

CREATE TABLE IF NOT EXISTS public.ai_crawler_visits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seen_at timestamptz NOT NULL DEFAULT now(),
  bot text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('user', 'search', 'training', 'preview')),
  path text NOT NULL,
  user_agent text
);

CREATE INDEX IF NOT EXISTS ai_crawler_visits_seen_at_idx
  ON public.ai_crawler_visits (seen_at DESC);

-- Row level security on with no policies: only the service role can read or
-- write. Grants are explicit because this project's service role does not get
-- table privileges by default.
ALTER TABLE public.ai_crawler_visits ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.ai_crawler_visits TO service_role;
