CREATE TABLE IF NOT EXISTS public.canonical_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_item_id uuid NOT NULL REFERENCES public.canonical_items(id) ON DELETE CASCADE,
  alias_text text NOT NULL,
  source text NOT NULL DEFAULT 'seed',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (canonical_item_id, alias_text)
);

CREATE INDEX IF NOT EXISTS canonical_aliases_alias_text_idx
ON public.canonical_aliases (lower(alias_text));
