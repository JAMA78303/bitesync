-- Allow a fifth kind of row in ai_crawler_visits: 'referral' — a person who
-- clicked through to BiteSync from an AI assistant's answer (ChatGPT,
-- Perplexity, Claude, Gemini, Copilot, …). Written by proxy.ts in production
-- only; the bot column holds the assistant's name, path the landing page, and
-- user_agent is left empty. No IP addresses, cookies or user data.

ALTER TABLE public.ai_crawler_visits
  DROP CONSTRAINT IF EXISTS ai_crawler_visits_kind_check;

ALTER TABLE public.ai_crawler_visits
  ADD CONSTRAINT ai_crawler_visits_kind_check
  CHECK (kind IN ('referral', 'user', 'search', 'training', 'preview'));
