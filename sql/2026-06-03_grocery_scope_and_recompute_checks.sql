-- BiteSync — run in Supabase SQL editor
-- 1) Grocery stale-scope (before deciding regenerate vs migration)
-- 2) Post–macro-recompute sanity checks (after npm run recompute:macros)

-- =============================================================================
-- PART A — Stale grocery scope (run BEFORE fixing grocery lists)
-- =============================================================================

-- A1. Plans with likely stale recipe-derived rows (primary scope query)
SELECT meal_plan_id, COUNT(*) AS stale_items
FROM grocery_items
WHERE archived_at IS NULL
  AND COALESCE(is_manual, false) = false
  AND (
    unit IN ('piece', 'pieces')
    OR name ~* '(tbsp|tsp|tablespoon|teaspoon|½|plus an extra)'
  )
GROUP BY meal_plan_id
ORDER BY stale_items DESC;

-- A2. How many distinct plans are affected? (quick headline number)
SELECT COUNT(DISTINCT meal_plan_id) AS plans_with_stale_grocery
FROM grocery_items
WHERE archived_at IS NULL
  AND COALESCE(is_manual, false) = false
  AND (
    unit IN ('piece', 'pieces')
    OR name ~* '(tbsp|tsp|tablespoon|teaspoon|½|plus an extra)'
  );

-- A3. Sample rows to eyeball (not just counts — false positives possible)
SELECT meal_plan_id, name, quantity, unit, is_manual, created_at
FROM grocery_items
WHERE archived_at IS NULL
  AND COALESCE(is_manual, false) = false
  AND (
    unit IN ('piece', 'pieces')
    OR name ~* '(tbsp|tsp|tablespoon|teaspoon|½|plus an extra)'
  )
ORDER BY created_at DESC
LIMIT 40;

-- A4. Broader: plans with piece-unit grocery rows only (review manually)
SELECT COUNT(DISTINCT meal_plan_id) AS plans_with_piece_unit_grocery
FROM grocery_items
WHERE archived_at IS NULL
  AND COALESCE(is_manual, false) = false
  AND unit IN ('piece', 'pieces');

-- Decision:
--   Few plans / few rows → regenerate those lists in the app (Grocery → Generate list)
--   Many plans → separate grocery re-derive task (NOT part of macro recompute)

-- =============================================================================
-- PART B — Post–macro-recompute checks (run AFTER npm run recompute:macros)
-- Macro recompute is NOT SQL — run in terminal:
--   npm run recompute:macros -- --dry-run
--   npm run recompute:macros
--   npm run recompute:macros -- --dry-run   (expect 0 changes)
-- Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
-- If admin recompute fails with "permission denied for table recipes", run:
--   sql/2026-06-04_service_role_recipe_grants.sql
-- =============================================================================

-- B1. Recipes with suspicious total calories (outliers to review)
SELECT r.id, r.name, r.servings, rn.calories, rn.coverage_pct, r.updated_at
FROM recipes r
JOIN recipe_nutrition rn ON rn.recipe_id = r.id
WHERE r.archived_at IS NULL
  AND (
    rn.calories IS NULL
    OR rn.calories < 50
    OR rn.calories > 4000
  )
ORDER BY rn.calories DESC NULLS LAST;

-- B2. Ingredients still using bogus piece units (parser should have repaired these)
SELECT ri.recipe_id, r.name AS recipe_name, ri.name, ri.quantity, ri.unit
FROM recipe_ingredients ri
JOIN recipes r ON r.id = ri.recipe_id
WHERE r.archived_at IS NULL
  AND (
    ri.unit IN ('piece', 'pieces')
    OR ri.name ~* '(tbsp|tsp|tablespoon|teaspoon|½|plus an extra)'
  )
ORDER BY r.name, ri.sort_order
LIMIT 100;

-- B3. Recently updated recipes (should reflect recompute timestamp)
SELECT r.id, r.name, rn.calories, rn.protein_g, rn.coverage_pct, r.updated_at
FROM recipes r
JOIN recipe_nutrition rn ON rn.recipe_id = r.id
WHERE r.archived_at IS NULL
ORDER BY r.updated_at DESC
LIMIT 20;

-- B4. Easy chicken fajitas spot-check (if imported — expect ~500–600 kcal/serving at servings=1)
SELECT r.id, r.name, r.servings, rn.calories,
       ROUND(rn.calories::numeric / GREATEST(r.servings, 1), 0) AS kcal_per_serving
FROM recipes r
JOIN recipe_nutrition rn ON rn.recipe_id = r.id
WHERE r.archived_at IS NULL
  AND r.name ILIKE '%fajita%';
