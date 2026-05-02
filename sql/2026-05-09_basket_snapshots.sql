CREATE TABLE IF NOT EXISTS public.basket_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_plan_id uuid NULL REFERENCES public.meal_plans(id) ON DELETE SET NULL,
  week_start_date date NOT NULL,
  goal_context jsonb NOT NULL,
  items jsonb NOT NULL,
  store_totals jsonb NOT NULL,
  recommended_store text NULL,
  basket_confidence numeric(5,2) NOT NULL,
  freshness_days integer NOT NULL,
  estimated_total_gbp numeric(10,2) NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS basket_snapshots_user_week_idx
ON public.basket_snapshots (user_id, week_start_date DESC);
