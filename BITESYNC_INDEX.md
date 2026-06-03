# BiteSync — Spec Index & Status Tracker

One place to track every build spec, merge order, and **verified-in-code** status.

Last updated: 2026-06-03

---

## How to use this file

Do not guess from screenshots. Ask Cursor to grep/read the repo, or run diagnostic scripts.

Status key: ✅ verified in code · 🟡 partial / needs migration run · ❌ not in code

---

## The specs

| # | Spec file | Covers | Status |
|---|---|---|---|
| 1 | `BITESYNC_FIXES.md` | Parser, kcal outlier, planner cards, social import | ✅ code done; kcal outliers need Spec 4 |
| 2 | `BITESYNC_RECIPE_MAKER.md` | CoFID ranking, context units, zero-qty block | ✅ verified in code |
| 3 | `BITESYNC_TARGET_MISMATCH.md` | 2027 vs 2227 calorie target | ✅ verified in code |
| 4 | `BITESYNC_MACRO_RECOMPUTE.md` | One-off macro repair migration | 🟡 script ready, NOT run |
| 5 | `BITESYNC_UI_UX.md` | Goals nav, grocery modal, TDEE, dashboard labels | ✅ verified in code |
| 6 | `BITESYNC_LANDING_DARKMODE.md` | Landing dark-mode contrast | ✅ verified in code |
| + | `BITESYNC_BUTTON_CONTRAST.md` | Generate grocery list invisible label | ✅ verified in code |
| + | `BITESYNC_PLANNER_NAMES.md` | Single-letter meal card titles | ✅ diagnosed + fixed (layout) |

---

## Merge / run order

1. **Spec 1** — parser + planner layout + import (foundation)
2. **Spec 2** — CoFID matching
3. **Spec 3** — target mismatch
4. **Spec 4** — macro recompute — ⚠️ only after Specs 1+2 merged; `--dry-run` first
5. **Specs 5, 6, button, planner names** — UI/contrast (independent)

---

## Planner single-letter names — diagnosis (BITESYNC_PLANNER_NAMES)

**Verdict: STEP 2B — layout/width bug (not missing CSS, not DB truncation by default).**

Evidence from code review (no DB credentials in CI):

| Finding | Detail |
|---|---|
| Committed layout | Horizontal card: 48px emoji + badge + `truncate` title in ~100px grid column |
| Visible width | ~20px left for title after emoji → **one character** before ellipsis |
| Stored names | Loaded via `recipe:recipes (id, name)` — full string unless user data is corrupt |
| Fix applied | `variant="grid"`: vertical stack, badge above title, `line-clamp-2`, `min-w-0`, wider columns |

**Confirm in your DB** (optional):

```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/diagnose-planner-names.ts
```

If any name is ≤2 chars → data bug (Step 2A); else layout fix is sufficient.

---

## Stale grocery snapshots (separate from Spec 4)

**Verdict: `grocery_items` is a persisted snapshot. Macro recompute does not touch it.**

The Spec 4 migration (`lib/recipes/macroRecompute.ts`) writes **only** to `recipe_ingredients` and `recipe_nutrition`. Confirmed in `applyRecipeRecompute()` — no `grocery_items` reads or writes. A stale line like `1 bottle ½ Tbsp Olive Oil Plus An Extra Drizzle (1 piece needed)` is a frozen row from an old generate; regenerating the list rebuilds from current `recipe_ingredients` via `generateGroceryList()` → `mergeScaledRecipeIngredients` → `normalizeIngredientsForShopping` → `replaceGroceryItemsWithMerged`.

**These are independent repairs.** Run Spec 4 for bad recipe nutrition / mangled ingredient rows. Fix stale grocery display separately — do not delay macro recompute because of a grocery line.

### Decision rule

| Scope query result | Action |
|---|---|
| One list, or a handful | **Regenerate by hand** (Grocery → Generate list). No migration extension, no code. |
| Many affected plans | **Separate task:** re-derive `grocery_items` for affected `meal_plan_id`s through the existing `generateGroceryList` pipeline, with dry-run + idempotent pattern. Do **not** bolt onto Spec 4. |

### Scope queries (run in Supabase SQL editor)

**Count plans with likely stale recipe-derived rows** (not manual items):

```sql
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
```

**Caution:** the `name ~*` pattern can false-positive on legitimate lines (e.g. a user-typed name containing "tbsp"). `is_manual = false` helps but is not enough — **eyeball the actual rows**, not just the count, before deciding "many."

**Optional — plans with piece-unit rows only** (broader, review manually):

```sql
SELECT COUNT(DISTINCT meal_plan_id) AS plans_with_piece_unit_grocery
FROM grocery_items
WHERE archived_at IS NULL
  AND COALESCE(is_manual, false) = false
  AND unit IN ('piece', 'pieces');
```

---

## Verified in code (2026-06-03)

### Spec 1 — FIXES

| Task | Status | Evidence |
|---|---|---|
| Ingredient parser | ✅ | `lib/recipes/parseIngredient.ts` |
| Social / URL import | ✅ | `app/api/recipes/import/route.ts` |
| Planner card layout | ✅ | `RecipeSlotCard` `variant="grid"`, `PlannerGrid` passes it |
| kcal outlier | 🟡 | Parser fixed; saved macros need Spec 4 recompute |

### Spec 2 — RECIPE_MAKER

| Task | Status | Evidence |
|---|---|---|
| CoFID match ranking | ✅ | `lib/nutrition/cofidMatch.ts`, ranked `lookupCoFID()` |
| Context-aware units | ✅ | `getUnitsForIngredient()`; RecipeForm + EditRecipeForm |
| Zero-qty block | ✅ | `lib/recipes/ingredientValidation.ts`; forms + actions |

### Spec 3 — TARGET_MISMATCH

| Task | Status | Evidence |
|---|---|---|
| Single source of truth | ✅ | `lib/utils/nutrition-targets.ts` |
| Stale target heal | ✅ | `getProfile()` auto-sync |
| All consumers wired | ✅ | nutrition, today, planner, ai-actions, goals |

### Spec 4 — MACRO_RECOMPUTE

| Task | Status | Evidence |
|---|---|---|
| Dry-run script | ✅ | `npm run recompute:macros -- --dry-run` |
| **Executed** | ❌ | Needs Supabase env vars |
| Grocery list repair | ➖ N/A | **Not in scope** — see [Stale grocery snapshots](#stale-grocery-snapshots-separate-from-spec-4) |

### Specs 5, 6, button

All ✅ — see prior commits in working tree.

---

## Next actions

1. **Spec 4** — with env vars set (independent of grocery snapshots):
   - `npm run recompute:macros -- --dry-run`
   - Review `scripts/reports/`
   - Real run → dry-run again (expect 0 changes)
2. **Stale grocery lists** — run [scope queries](#scope-queries-run-in-supabase-sql-editor) above:
   - Few plans → regenerate those lists in the app
   - Many plans → schedule separate grocery re-derive task (not Spec 4)
3. Run `sql/2026-06-02_recipes_source_type.sql` in Supabase if not applied.

---

## Note

Parser + CoFID matcher fixes are highest leverage — bad output flows into grocery, planner totals, and dashboard. Macro recompute (Spec 4) repairs already-saved **recipe** rows once Specs 1+2 are deployed; saved **grocery** snapshots only refresh on regenerate (or a future dedicated migration if scope is high).
