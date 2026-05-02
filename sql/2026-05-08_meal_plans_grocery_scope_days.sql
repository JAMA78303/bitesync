-- Days (0=Mon … 6=Sun) included in the last grocery generation; NULL = whole week / legacy.
ALTER TABLE public.meal_plans
ADD COLUMN IF NOT EXISTS grocery_scope_days SMALLINT[] DEFAULT NULL;

COMMENT ON COLUMN public.meal_plans.grocery_scope_days IS 'Planner days included when grocery list was last generated; NULL means full-week labeling';
